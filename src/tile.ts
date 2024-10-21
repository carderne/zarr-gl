// ChunkTuple goes [Y, X]
export type ChunkTuple = [number, number];

export interface Data {
  data: Float32Array;
  offset: number;
  stride: [number, number];
}

interface TileProps {
  chunk: ChunkTuple;
  loader: Loader;
  gl: WebGL2RenderingContext;
}

export type Loader = (
  chunk: ChunkTuple,
  callback: (err: Error, data: Data) => void,
) => void;

class Tile {
  chunk: ChunkTuple;
  loader: Loader;
  data: Float32Array | null;

  loading: boolean;

  tileTexture: WebGLTexture;
  vertexBuffer: WebGLBuffer;
  pixCoordBuffer: WebGLBuffer;

  constructor({ chunk, loader, gl }: TileProps) {
    this.chunk = chunk;
    this.data = null;
    this.loader = loader;

    this.loading = false;

    this.tileTexture = gl.createTexture();
    this.vertexBuffer = gl.createBuffer();
    this.pixCoordBuffer = gl.createBuffer();
  }

  async fetchData() {
    if (this.data) {
      return this.data;
    } else if (!this.loading) {
      return await new Promise<Float32Array>((resolve) => {
        this.loading = true;
        this.loader(this.chunk, (_: Error, data: Data) => {
          this.data = data.data;
          this.loading = false;
          resolve(this.data);
        });
      });
    }
  }
}

export default Tile;
