declare module "zarr-js" {
  export interface Data {
    data: Float32Array;
    offset: number;
    stride: [number, number];
  }

  // ChunkTuple goes [Y, X]
  export type ChunkTuple = [number, number];

  export type Loader = (
    chunk: ChunkTuple,
    callback: (err: Error, data: Data) => void,
  ) => void;

  export interface Multiscale {
    datasets: { path: string; pixels_per_tile: number; crs: string }[];
  }

  export interface Zarray {
    chunks: number[][];
  }

  export interface Metadata {
    metadata: Record<string, Zarray & { multiscales: Multiscale[] }>;
  }

  export interface ZarrGroup {
    openGroup(
      source: string,
      callback: (
        err: Error,
        loaders: Record<string, Loader>,
        metadata: Metadata,
      ) => void,
    ): void;
  }

  export default function zarr(
    fetch: typeof window.fetch,
    version: string,
  ): ZarrGroup;
}
