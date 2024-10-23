import * as zarr from "zarrita";

export interface Multiscale {
  datasets: { path: string; pixels_per_tile: number; crs: string }[];
}

// ChunkTuple goes [Y, X]
export type ChunkTuple = [number, number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZArray = zarr.Array<zarr.DataType, any>;

const zarrLoad = async (source: string) => {
  const store = new zarr.FetchStore(source);
  const group = await zarr.open(store, { kind: "group" });

  const zattrs = group.attrs;
  const multiscales = zattrs.multiscales as Multiscale[] | undefined;
  if (!multiscales) {
    throw new Error(`Failed to find multiscales in attrs for ${source}`);
  }
  const datasets = multiscales[0]?.datasets;
  if (!datasets) {
    throw new Error(`Failed to find datasets in attrs for ${source}`);
  }
  const levels = datasets.map((dataset) => Number(dataset.path));

  return { group, levels };
};

export default zarrLoad;
