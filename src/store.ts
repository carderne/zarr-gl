import zarr from "zarr-js";
import type { Loader } from "./tile";

interface Multiscale {
  datasets: { path: string; pixels_per_tile: number; crs: string }[];
}

interface Zarray {
  chunks: number[][];
}

interface Metadata {
  metadata: Record<string, Zarray & { multiscales: Multiscale[] }>;
}

const zarrLoad = async (source: string, version: "v2", variable: string) => {
  let metadata: Metadata;
  let loaders: Record<string, Loader>;

  await new Promise<void>((resolve) =>
    zarr(window.fetch, version).openGroup(
      source,
      (_err: Error, l: Record<string, Loader>, m: Metadata) => {
        loaders = l;
        metadata = m;
        resolve();
      },
    ),
  );
  const multiscales = metadata.metadata[".zattrs"].multiscales;
  const datasets = multiscales[0].datasets;
  const levels = datasets.map((dataset) => Number(dataset.path));
  const zarray = metadata.metadata[`${levels[0]}/${variable}/.zarray`];
  const chunks = zarray.chunks;

  return { loaders, chunks, levels };
};

export default zarrLoad;
