import type { ChunkTuple, Data, Loader } from "zarr-js";
import { mustCreateBuffer, mustCreateTexture, timeout } from "./utils";

interface TileProps {
  chunk: ChunkTuple;
  loader: Loader;
  gl: WebGL2RenderingContext | false;
}

class Tile {
  chunk: ChunkTuple;
  loader: Loader;
  data: Float32Array | null = null;

  loading: boolean = false;

  tileTexture: WebGLTexture;
  vertexBuffer: WebGLBuffer;
  pixCoordBuffer: WebGLBuffer;

  constructor({ chunk, loader, gl }: TileProps) {
    this.chunk = chunk;
    this.loader = loader;

    if (gl) {
      // Maybe a bad idea supporting this?
      // Allows tiles to be used for data fetching but not WebGL
      // Should probably add a separate API for this...
      this.tileTexture = mustCreateTexture(gl);
      this.vertexBuffer = mustCreateBuffer(gl);
      this.pixCoordBuffer = mustCreateBuffer(gl);
    }
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
      this.loader(this.chunk, (_: Error, data: Data) => {
        this.loading = false;
        this.data = data.data;
        resolve(this.data);
      });
    });
  }
}

export default Tile;
