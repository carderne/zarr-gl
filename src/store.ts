// This code adapted from:
// https://github.com/carbonplan/maps
// With the following license:
// MIT License
// Copyright (c) 2021 carbonplan

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
  const maxZoom = Math.max(...levels);
  const tileSize = datasets[0]?.pixels_per_tile;
  const crs = datasets[0]?.crs ?? "EPSG:3857";
  if (!tileSize) {
    throw new Error("No `pixels_per_tile` value in `multiscales` metadata.");
  }
  return { levels, maxZoom, tileSize, crs };
};

const loadZarrV2 = async (
  source: string,
  variable: string,
  transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>,
) => {
  const createStore = createFetchStore(transformRequest);
  const store = await createStore(source);

  const grp = await zarr.open.v2(store, { kind: "group" });
  const rootAttrs = grp.attrs as Record<string, unknown>;
  const multiscales = rootAttrs.multiscales as Multiscale[];
  const { levels, maxZoom, tileSize, crs } = getPyramidMetadata(multiscales);

  // Use zarr.root() to create a Location, then resolve paths
  const location = zarr.root(store);
  const array = await zarr.open(location.resolve(`${levels[0]}/${variable}`), {
    kind: "array",
  });

  const arrayAttrs = array.attrs as Record<string, unknown>;
  const dimensions = arrayAttrs._ARRAY_DIMENSIONS as string[];
  const shape = array.shape;
  const chunks = array.chunks;

  const loaders = Object.fromEntries(
    await Promise.all(
      levels.map(async (level: number) => [
        `${level}/${variable}`,
        await zarr.open(location.resolve(`${level}/${variable}`), {
          kind: "array",
        }),
      ]),
    ),
  );

  const dimArrs = Object.fromEntries(
    await Promise.all(
      dimensions.map(async (dim) => {
        const dimArray = await zarr.open(location.resolve(`${levels[0]}/${dim}`), {
          kind: "array",
        });
        const data = await zarr.get(dimArray);
        return [dim, Array.from(data.data as Float32Array)];
      }),
    ),
  );

  return {
    loaders,
    dimensions,
    dimArrs,
    levels,
    maxZoom,
    tileSize,
    crs,
    shape: shape as number[],
    chunks: chunks as number[],
    fillValue: 0, // TODO should we get rid of fillValue since zarrita?
  };
};

const loadZarrV3 = async (
  source: string,
  variable: string,
  transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>,
) => {
  const createStore = createFetchStore(transformRequest);
  const store = await createStore(source);

  const grp = await zarr.open.v3(store, { kind: "group" });
  const rootAttrs = grp.attrs as Record<string, unknown>;
  const multiscales = rootAttrs.multiscales as Multiscale[];
  const { levels, maxZoom, tileSize, crs } = getPyramidMetadata(multiscales);

  // Use zarr.root() to create a Location, then resolve paths
  const location = zarr.root(store);
  const array = await zarr.open(location.resolve(`${levels[0]}/${variable}`), {
    kind: "array",
  });

  const arrayAttrs = array.attrs as Record<string, unknown>;
  const dimensions = arrayAttrs._ARRAY_DIMENSIONS as string[];
  const shape = array.shape;
  const chunks = array.chunks;

  const loaders = Object.fromEntries(
    await Promise.all(
      levels.map(async (level: number) => [
        `${level}/${variable}`,
        await zarr.open(location.resolve(`${level}/${variable}`), {
          kind: "array",
        }),
      ]),
    ),
  );

  const dimArrs = Object.fromEntries(
    await Promise.all(
      dimensions.map(async (dim) => {
        const dimArray = await zarr.open(location.resolve(`${levels[0]}/${dim}`), {
          kind: "array",
        });
        const data = await zarr.get(dimArray);
        return [dim, Array.from(data.data as Float32Array)];
      }),
    ),
  );

  return {
    loaders,
    dimensions,
    dimArrs,
    levels,
    maxZoom,
    tileSize,
    crs,
    shape: shape as number[],
    chunks: chunks as number[],
    fillValue: 0, // TODO should we get rid of fillValue since zarrita?
  };
};

const loadZarr = async (
  source: string,
  variable: string,
  version: "v2" | "v3",
  transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>,
): ReturnType<typeof loadZarrV2> => {
  return version === "v2"
    ? loadZarrV2(source, variable, transformRequest)
    : loadZarrV3(source, variable, transformRequest);
};

export default loadZarr;
