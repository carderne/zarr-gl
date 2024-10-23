import type { ChunkTuple, ZArray } from "./store";
import { mustCreateBuffer, mustCreateTexture, timeout } from "./utils";

interface TileProps {
  chunk: ChunkTuple;
  arr: ZArray;
  gl: WebGL2RenderingContext;
}

class Tile {
  chunk: ChunkTuple;
  arr: ZArray;
  data: Float32Array | null;

  loading: boolean;

  tileTexture: WebGLTexture;
  vertexBuffer: WebGLBuffer;
  pixCoordBuffer: WebGLBuffer;

  constructor({ chunk, arr, gl }: TileProps) {
    this.chunk = chunk;
    this.data = null;
    this.arr = arr;

    this.loading = false;

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
    this.loading = true;
    const data = await this.arr.getChunk(this.chunk);
    this.data = data.data as Float32Array;
    this.loading = false;
    return this.data;
  }
}

export default Tile;
