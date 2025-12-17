import { getChunks, mustCreateBuffer, mustCreateTexture, ChunkTuple } from "./utils";
import type { Array as ZarrArray, DataType } from "zarrita";

interface TileProps {
  chunk: ChunkTuple;
  chunks: number[];
  loader: ZarrArray<DataType>;

  dimensions: string[];
  shape: number[];
  dimArrs: Record<string, number[]>;

  gl: WebGL2RenderingContext;

  z: number;
  x: number;
  y: number;
}

class Tile {
  chunk: ChunkTuple;
  chunks: number[];
  loader: ZarrArray<DataType>;

  dimensions: string[];
  shape: number[];
  dimArrs: Record<string, number[]>;
  data: Float32Array | null = null;
  dataCache: Record<string, Float32Array | null>;

  z: number;
  x: number;
  y: number;

  loading: boolean = false;
  loadingPromise: Promise<Float32Array> | null = null;

  tileTexture: WebGLTexture;
  vertexBuffer: WebGLBuffer;
  pixCoordBuffer: WebGLBuffer;

  constructor({ chunk, chunks, loader, dimensions, shape, dimArrs, z, x, y, gl }: TileProps) {
    this.chunk = chunk;
    this.chunks = chunks;
    this.loader = loader;

    this.dimensions = dimensions;
    this.shape = shape;
    this.dimArrs = dimArrs;
    this.dataCache = {};

    this.z = z;
    this.x = x;
    this.y = y;

    this.tileTexture = mustCreateTexture(gl);
    this.vertexBuffer = mustCreateBuffer(gl);
    this.pixCoordBuffer = mustCreateBuffer(gl);
  }

  async fetchData(selector: Record<string, number>): Promise<Float32Array> {
    const neededChunks = getChunks({
      selector,
      dimensions: this.dimensions,
      dimArrs: this.dimArrs,
      shape: this.shape,
      chunks: this.chunks,
      x: this.x,
      y: this.y,
    });
    const chunk = neededChunks[0];
    if (neededChunks.length !== 1 || !chunk) {
      throw new Error("Need exactly one chunk per tile");
    }
    const chunkKey = chunk.join(",");
    if (this.dataCache[chunkKey]) {
      this.data = this.dataCache[chunkKey];
      return this.data;
    } else if (this.loadingPromise) {
      // If already loading, return the existing promise
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      this.loading = true;

      const chunkData = await this.loader.getChunk(chunk);
      this.loading = false;
      this.loadingPromise = null;

      // TODO support other data types and slicing chunks
      if (!(chunkData.data instanceof Float32Array)) {
        throw new Error("zarr-gl only supports Float32Array chunk data");
      }
      this.data = chunkData.data;
      this.dataCache[chunkKey] = this.data;
      return this.data;
    })();

    return this.loadingPromise;
  }

  getDimension(dimension: string): number | undefined {
    const index = this.dimensions.indexOf(dimension);
    if (index === -1) {
      return undefined;
    }
    return this.chunks[index];
  }
}

export default Tile;
