// This code adapted from:
// https://github.com/carbonplan/maps
// With the following license:
// MIT License
// Copyright (c) 2021 carbonplan

import type { Array as ZarrArray, DataType } from "zarrita";
import * as zarr from "zarrita";

export interface MultiscaleDataset {
  path: string;
  pixels_per_tile?: number;
  crs?: string;
}

export interface Multiscale {
  datasets: MultiscaleDataset[];
}

export interface RequestParameters {
  url: string;
  headers?: { [key: string]: string };
  credentials?: RequestCredentials;
}

const createFetchStore = (
  transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>,
) => {
  if (!transformRequest) {
    return (url: string) => new zarr.FetchStore(url);
  }

  return async (url: string) => {
    const requestParams = await transformRequest(url);
    return new zarr.FetchStore(requestParams.url, {
      overrides: {
        headers: requestParams.headers,
        credentials: requestParams.credentials,
      },
    });
  };
};

const getPyramidMetadata = (multiscales: Multiscale[]) => {
  const datasets = multiscales[0]?.datasets;
  if (!datasets) {
    throw new Error("No `multiscales` or `datasets` in zarr metadata");
  }

  const levels = datasets.map((dataset) => Number(dataset.path));
  if (levels.length === 0) {
    throw new Error("No levels found in multiscales metadata");
  }

  const maxZoom = Math.max(...levels);
  const tileSize = datasets[0]?.pixels_per_tile;
  const crs = datasets[0]?.crs ?? "EPSG:3857";
  if (!tileSize) {
    throw new Error("No `pixels_per_tile` value in `multiscales` metadata.");
  }
  return { levels, maxZoom, tileSize, crs };
};

// TODO: Migrate to get these data from zarrita to expose dimension_names and fill_value
// and remove version specific code.
// @see: https://github.com/manzt/zarrita.js/issues/281
const getMetadataV2 = async (
  store: zarr.FetchStore,
  location: zarr.Location<zarr.FetchStore>,
  variable: string,
  firstLevel: number,
): Promise<{ dimensions: string[]; fillValue: number }> => {
  const arrayLocation = location.resolve(`${firstLevel}/${variable}`);

  const array = await zarr.open(arrayLocation, { kind: "array" });
  const arrayAttrs = array.attrs;
  const dimensions = arrayAttrs._ARRAY_DIMENSIONS as string[];

  const metadataPath = arrayLocation.resolve(".zarray").path;
  const metadataBytes = await store.get(metadataPath);
  if (!metadataBytes) {
    throw new Error(`Could not load metadata from ${metadataPath}`);
  }
  const metadata = JSON.parse(new TextDecoder().decode(metadataBytes)) as {
    fill_value?: number;
  };
  const fillValue = metadata.fill_value ?? 0;

  return { dimensions, fillValue };
};

const getMetadataV3 = async (
  store: zarr.FetchStore,
  location: zarr.Location<zarr.FetchStore>,
  variable: string,
  firstLevel: number,
): Promise<{ dimensions: string[]; fillValue: number }> => {
  const arrayLocation = location.resolve(`${firstLevel}/${variable}`);
  const metadataPath = arrayLocation.resolve("zarr.json").path;
  const metadataBytes = await store.get(metadataPath);
  if (!metadataBytes) {
    throw new Error(`Could not load metadata from ${metadataPath}`);
  }
  const metadata = JSON.parse(new TextDecoder().decode(metadataBytes)) as {
    dimension_names?: string[];
    fill_value?: number;
  };
  const dimensions = metadata.dimension_names ?? [];
  const fillValue = metadata.fill_value ?? 0;
  return { dimensions, fillValue };
};

const loadLoaders = async (
  location: zarr.Location<zarr.FetchStore>,
  levels: number[],
  variable: string,
): Promise<Record<string, ZarrArray<DataType>>> => {
  return Object.fromEntries(
    await Promise.all(
      levels.map(async (level: number) => [
        `${level}/${variable}`,
        await zarr.open(location.resolve(`${level}/${variable}`), {
          kind: "array",
        }),
      ]),
    ),
  ) as Record<string, ZarrArray<DataType>>;
};

const loadDimensionArrays = async (
  location: zarr.Location<zarr.FetchStore>,
  dimensions: string[],
  firstLevel: number,
): Promise<Record<string, number[]>> => {
  return Object.fromEntries(
    await Promise.all(
      dimensions.map(async (dim) => {
        const dimArray = await zarr.open(location.resolve(`${firstLevel}/${dim}`), {
          kind: "array",
        });
        const data = (await zarr.get(dimArray)).data;
        if (!(data instanceof Float32Array)) {
          throw new Error("zarr-gl only supports Float32Array dimension arrays");
        }

        return [dim, Array.from(data)];
      }),
    ),
  );
};

const loadZarrVersion = async (
  source: string,
  variable: string,
  transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>,
) => {
  const createStore = createFetchStore(transformRequest);
  const store = await createStore(source);

  const grp = await zarr.open(store, { kind: "group" });
  const multiscales = grp.attrs.multiscales as Multiscale[];
  const { levels, maxZoom, tileSize, crs } = getPyramidMetadata(multiscales);

  const firstLevel = levels[0]!;
  const location = zarr.root(store);

  // Try v2 first, fall back to v3 if it fails
  let dimensions: string[];
  let fillValue: number;
  try {
    const metadata = await getMetadataV2(store, location, variable, firstLevel);
    dimensions = metadata.dimensions;
    fillValue = metadata.fillValue;
  } catch {
    const metadata = await getMetadataV3(store, location, variable, firstLevel);
    dimensions = metadata.dimensions;
    fillValue = metadata.fillValue;
  }

  const array = await zarr.open(location.resolve(`${firstLevel}/${variable}`), {
    kind: "array",
  });

  const shape = array.shape;
  const chunks = array.chunks;

  const loaders = await loadLoaders(location, levels, variable);
  const dimArrs = await loadDimensionArrays(location, dimensions, firstLevel);

  return {
    loaders,
    dimensions,
    dimArrs,
    levels,
    maxZoom,
    tileSize,
    crs,
    shape: shape,
    chunks: chunks,
    fillValue,
  };
};

const loadZarr = async (
  source: string,
  variable: string,
  transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>,
): ReturnType<typeof loadZarrVersion> => {
  return loadZarrVersion(source, variable, transformRequest);
};

export default loadZarr;
