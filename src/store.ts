import zarr from "zarr-js";
import type { Loader, Metadata } from "zarr-js";

const zarrLoad = async (source: string, version: "v2", variable: string) => {
  const [loaders, metadata] = await new Promise<
    [Record<string, Loader>, Metadata]
  >((resolve, reject) => {
    zarr(window.fetch, version).openGroup(
      source,
      (err: Error, l: Record<string, Loader>, m: Metadata) => {
        if (err) reject(err);
        else resolve([l, m]);
      },
    );
  });

  const zattrs = metadata.metadata[".zattrs"];
  if (!zattrs) {
    throw new Error(`Failed to load .zattrs for ${source}`);
  }
  const multiscales = zattrs.multiscales;
  const datasets = multiscales[0]?.datasets;
  if (!datasets) {
    throw new Error(`Failed to load .zattrs for ${source}`);
  }
  const levels = datasets.map((dataset) => Number(dataset.path));
  const zarrayPath = `${levels[0]}/${variable}/.zarray`;
  const zarray = metadata.metadata[zarrayPath];
  if (!zarray) {
    throw new Error(`Failed to load .zarray for ${source} and ${zarrayPath}`);
  }
  const chunks = zarray.chunks;

  return { loaders, chunks, levels };
};

export default zarrLoad;
