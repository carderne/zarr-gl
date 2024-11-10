declare module "zarr-js" {
  // ChunkTuple goes [Z, Y, X]
  export type ChunkTuple = number[];

  export type Loader = (
    chunk: ChunkTuple,
    callback: (err: Error, data: import("ndarray").NdArray) => void,
  ) => void;

  export interface Multiscale {
    datasets: { path: string; pixels_per_tile: number; crs: string }[];
  }

  export interface Zarray {
    shape: number[];
    chunks: number[];
    fill_value: number;
    dtype: string;
  }

  export interface Zattrs {
    _ARRAY_DIMENSIONS: string[];
  }

  export interface Metadata {
    metadata: Record<string, Zarray & Zattrs & { multiscales: Multiscale[] }>;
  }

  export interface ZarrGroupV2 {
    openGroup(
      source: string,
      callback: (
        err: Error,
        loaders: Record<string, Loader>,
        metadata: Metadata,
      ) => void,
    ): void;
  }

  export interface ZarrGroupV3 {
    open(source: string, callback: (err: Error, get: Loader) => void): void;
  }

  export default function zarr(
    fetch: typeof window.fetch,
    version: "v2",
  ): ZarrGroupV2;
  export default function zarr(
    fetch: typeof window.fetch,
    version: "v3",
  ): ZarrGroupV3;
}
