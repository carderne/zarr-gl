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
  band: string;
  gl: WebGL2RenderingContext;
}

export type Loader = (
  chunk: ChunkTuple,
  callback: (err: Error, data: Data) => void,
) => void;

const WIDTH = 128;
const HEIGHT = 128;

class Tile {
  chunk: ChunkTuple;
  loader: Loader;
  band: string;
  data: Float32Array | null;

  loading: boolean;

  gl: WebGL2RenderingContext;
  tileTexture: WebGLTexture;
  tileBuffer: WebGLBuffer;
  bufferData: Float32Array;
  texCoordBuffer: WebGLBuffer;
  texCoordBufferData: Float32Array;

  constructor({ chunk, loader, band, gl }: TileProps) {
    this.chunk = chunk;
    this.band = band;
    this.data = null;
    this.loader = loader;

    this.loading = false;

    this.gl = gl;
    this.tileTexture = gl.createTexture();
    this.tileBuffer = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();

    // prettier-ignore
    this.bufferData = new Float32Array([
      -1.0,  1.0,  // left top
      -1.0, -1.0,  // left bottom
       1.0,  1.0,  // right top
       1.0, -1.0,  // right bottom
    ]);
    // prettier-ignore
    this.texCoordBufferData = new Float32Array([
        0.0, 0.0,  // left side
        0.0, 1.0,
        1.0, 0.0,  // right side
        1.0, 1.0,
    ]);
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

  async loadBuffer() {
    const data = await this.fetchData();
    if (!data) {
      return;
    }

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tileBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.texCoordBufferData, gl.STATIC_DRAW);

    // Bind and set texture for the tile
    gl.bindTexture(gl.TEXTURE_2D, this.tileTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R32F,
      WIDTH,
      HEIGHT,
      0,
      gl.RED,
      gl.FLOAT,
      data,
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
}

export default Tile;
