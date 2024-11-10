import type { ChunkTuple, Loader } from "zarr-js";
import {
  getChunks,
  mustCreateBuffer,
  mustCreateTexture,
  timeout,
} from "./utils";
import type { NdArray } from "ndarray";

interface TileProps {
  chunk: ChunkTuple;
  chunks: number[];
  loader: Loader;

  selector: Record<string, number>;
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
  loader: Loader;

  selector: Record<string, number>;
  dimensions: string[];
  shape: number[];
  dimArrs: Record<string, number[]>;
  data: Float32Array | null = null;

  z: number;
  x: number;
  y: number;

  loading: boolean = false;

  tileTexture: WebGLTexture;
  vertexBuffer: WebGLBuffer;
  pixCoordBuffer: WebGLBuffer;

  constructor({
    chunk,
    chunks,
    loader,
    selector,
    dimensions,
    shape,
    dimArrs,
    z,
    x,
    y,
    gl,
  }: TileProps) {
    this.chunk = chunk;
    this.chunks = chunks;
    this.loader = loader;

    this.selector = selector;
    this.dimensions = dimensions;
    this.shape = shape;
    this.dimArrs = dimArrs;

    this.z = z;
    this.x = x;
    this.y = y;

    this.tileTexture = mustCreateTexture(gl);
    this.vertexBuffer = mustCreateBuffer(gl);
    this.pixCoordBuffer = mustCreateBuffer(gl);
  }

  async fetchData(): Promise<Float32Array> {
    if (this.data) {
      return this.data;
    } else if (this.loading) {
      // This is probably a bad idea...
      await timeout(500);
      return this.fetchData();
    }
    return await new Promise<Float32Array>((resolve) => {
      this.loading = true;
      const neededChunks = getChunks({
        selector: this.selector,
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
      const indexIntoChunk = this.dimensions.map((d) => {
        if (["x", "y"].includes(d)) {
          return null;
        } else if (this.selector[d] === undefined) {
          return null;
        } else {
          const idx = this.dimArrs[d]?.findIndex(
            (coordinate) => coordinate === this.selector[d],
          );
          if (typeof idx === "undefined") {
            throw new Error("Couldnt extract indices from dimArrs");
          }
          return idx;
        }
      });
      this.loader(chunk, (_: Error, data: NdArray) => {
        this.loading = false;

        const d = data.pick(...indexIntoChunk);
        this.data = d.data as Float32Array; // TODO
        resolve(this.data);
      });
    });
  }
}

export default Tile;
