// This code adapted from:
// https://github.com/carbonplan/maps
// With the following license:
// MIT License
// Copyright (c) 2021 carbonplan

import zarr from "zarr-js";
import type { Loader, Metadata, Multiscale } from "zarr-js";

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

const loadZarrV2 = async (source: string, variable: string) => {
  const [loaders, metadata] = await new Promise<
    [Record<string, Loader>, Metadata]
  >((resolve, reject) => {
    zarr(window.fetch, "v2").openGroup(
      source,
      (err: Error, l: Record<string, Loader>, m: Metadata) => {
        if (err) reject(err);
        resolve([l, m]);
      },
    );
  });

  const rootZattrs = metadata.metadata[".zattrs"];
  if (!rootZattrs) {
    throw new Error(`Failed to load .zattrs for ${source}`);
  }
  const multiscales = rootZattrs.multiscales;
  const datasets = multiscales[0]?.datasets;
  if (!datasets) {
    throw new Error(`Failed to load .zattrs for ${source}`);
  }
  const { levels, maxZoom, tileSize, crs } = getPyramidMetadata(multiscales);
  const zarrayPath = `${levels[0]}/${variable}/.zarray`;
  const zarray = metadata.metadata[zarrayPath];
  if (!zarray) {
    throw new Error(`Failed to load .zarray for ${source} and ${zarrayPath}`);
  }
  const shape = zarray.shape;
  const chunks = zarray.chunks;
  const fillValue = zarray.fill_value;

  const zattrsPath = `${levels[0]}/${variable}/.zattrs`;
  const zattrs = metadata.metadata[zattrsPath];
  if (!zattrs) {
    throw new Error(`Failed to load .zattrs for ${source} and ${zarrayPath}`);
  }
  const dimensions = zattrs._ARRAY_DIMENSIONS;

  const dimArrs = Object.fromEntries(
    await Promise.all(
      dimensions.map(
        (dim) =>
          new Promise<[string, number[]]>((resolve, reject) => {
            const loader = loaders[`${levels[0]}/${dim}`];
            if (!loader || typeof loader === "undefined") {
              reject(`No loader for dimension ${dim}`);
              return;
            }
            loader([0], (err, chunk) => {
              if (err) {
                reject(err);
                return;
              }
              resolve([dim, Array.from(chunk.data as Float32Array)]);
            });
          }),
      ),
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
    shape,
    chunks,
    fillValue,
  };
};

const loadZarrV3 = async (source: string, variable: string) => {
  const metadata = await fetch(`${source}/zarr.json`).then((res) => res.json());
  const { levels, maxZoom, tileSize, crs } = getPyramidMetadata(
    metadata.attributes.multiscales,
  );

  const arrayMetadata = await fetch(
    `${source}/${levels[0]}/${variable}/zarr.json`,
  ).then((res) => res.json());

  const dimensions = arrayMetadata.attributes._ARRAY_DIMENSIONS as string[];
  const shape = arrayMetadata.shape;
  const isSharded = arrayMetadata.codecs[0].name == "sharding_indexed";
  const chunks = isSharded
    ? arrayMetadata.codecs[0].configuration.chunk_shape
    : arrayMetadata.chunk_grid.configuration.chunk_shape;
  const fillValue = arrayMetadata.fill_value;

  const loaders = Object.fromEntries(
    await Promise.all(
      levels.map(
        (level) =>
          new Promise<[string, Loader]>((resolve, reject) => {
            zarr(window.fetch, "v3").open(
              `${source}/${level}/${variable}`,
              (err: Error, get: Loader) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve([`${level}/${variable}`, get]);
              },
            );
          }),
      ),
    ),
  );

  const dimArrs = Object.fromEntries(
    await Promise.all(
      dimensions.map(
        (dim) =>
          new Promise<[string, number[]]>((resolve, reject) => {
            zarr(window.fetch, "v3").open(
              `${source}/${levels[0]}/${dim}`,
              (err: Error, get: Loader) => {
                if (err) {
                  reject(err);
                  return;
                }
                get([0], (err, chunk) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve([dim, Array.from(chunk.data as Float32Array)]);
                });
              },
            );
          }),
      ),
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
    fillValue: fillValue as number,
  };
};

const loadZarr = async (
  source: string,
  variable: string,
  version: "v2" | "v3",
): ReturnType<typeof loadZarrV2> => {
  const res =
    version === "v2"
      ? loadZarrV2(source, variable)
      : loadZarrV3(source, variable);
  return res;
};

export default loadZarr;
