import type { Map } from "mapbox-gl";
import {
  zoomToLevel,
  tileToScale,
  createShader,
  createProgram,
  getTilesAtZoom,
  tileToKey,
} from "./utils";
import Tile, { type Loader, type ChunkTuple } from "./tile";
import zarrLoad from "./store";
// @ts-expect-error TODO figure out type declaration for this
import fragmentSource from "./shaders/frag.glsl";
// @ts-expect-error TODO figure out type declaration for this
import vertexSource from "./shaders/vert.glsl";

type RGB = [number, number, number];

// TODO load these from zarr
const WIDTH = 128;
const HEIGHT = 128;

interface ZarrLayerProps {
  map: Map;
  id: string; // id for the layer, must be unique
  source: string; // Zarr source URL
  variable: string; // Zarr variable to display
  colormap: RGB[]; // array of RGB triplets in 0-255
  vmin: number; // lower bound for colormap
  vmax: number; // upper bound for colormap
  opacity?: number;
  minRenderZoom?: number;
  invalidate?: () => void;
}

class ZarrLayer {
  type: "custom";
  renderingMode: "2d";

  map: Map;
  id: string;
  zarrSource: string;
  variable: string;
  invalidate: () => void;

  cmapLength: number;
  cmap: Float32Array;
  vmin: number;
  vmax: number;
  opacity: number;
  minRenderZoom: number;

  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  loaders: Record<string, Loader>;
  tiles: Record<string, Tile>;

  scaleLoc: WebGLUniformLocation;
  shiftXLoc: WebGLUniformLocation;
  shiftYLoc: WebGLUniformLocation;
  matrixLoc: WebGLUniformLocation;

  vminLoc: WebGLUniformLocation;
  vmaxLoc: WebGLUniformLocation;
  opacityLoc: WebGLUniformLocation;
  noDataLoc: WebGLUniformLocation;

  vertexLoc: number;
  cmapTex: WebGLTexture;
  cmapLoc: WebGLUniformLocation;

  bufferData: Float32Array;
  texCoordBufferData: Float32Array;

  texLoc: WebGLUniformLocation;
  texCoordLoc: GLint;

  constructor({
    id,
    source,
    variable,
    map,
    colormap,
    vmin,
    vmax,
    opacity = 1,
    minRenderZoom = 3,
    invalidate = () => {},
  }: ZarrLayerProps) {
    this.type = "custom";
    this.renderingMode = "2d";

    this.id = id;
    this.zarrSource = source;
    this.variable = variable;
    this.invalidate = invalidate;

    this.cmap = new Float32Array(colormap.flat().map((v) => v / 255.0));
    this.cmapLength = colormap.length;
    this.vmin = vmin;
    this.vmax = vmax;
    this.opacity = opacity;
    this.minRenderZoom = minRenderZoom;

    this.map = map;

    this.loaders = {};
    this.tiles = {};
  }

  setOpacity(opacity: number) {
    this.opacity = opacity;
    this.invalidate();
  }

  setVminVmax(vmin: number, vmax: number) {
    this.vmin = vmin;
    this.vmax = vmax;
    this.invalidate();
  }

  async setVariable(variable: string) {
    this.variable = variable;
    this.tiles = {};
    await this.prepareTiles();
    this.invalidate();
  }

  async prepareTiles() {
    const { loaders, levels } = await zarrLoad(
      this.zarrSource,
      "v2",
      this.variable,
    );
    levels.forEach((z: number) => {
      const loader = loaders[z + "/" + this.variable];
      this.loaders[z] = loader;
      Array.from({ length: Math.pow(2, z) }, (_, x) => {
        Array.from({ length: Math.pow(2, z) }, (_, y) => {
          const key = [z, x, y].join(",");
          const chunk: ChunkTuple = [y, x]; // NOTE: chunks go [Y, X]
          this.tiles[key] = new Tile({
            chunk,
            loader,
            gl: this.gl,
          });
        });
      });
    });
  }

  async onAdd(_map: Map, gl: WebGL2RenderingContext) {
    this.gl = gl;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    this.program = createProgram(gl, vertexShader, fragmentShader);

    this.scaleLoc = gl.getUniformLocation(this.program, "scale");
    this.shiftXLoc = gl.getUniformLocation(this.program, "shift_x");
    this.shiftYLoc = gl.getUniformLocation(this.program, "shift_y");
    this.matrixLoc = gl.getUniformLocation(this.program, "u_matrix");

    this.vminLoc = gl.getUniformLocation(this.program, "vmin");
    this.vmaxLoc = gl.getUniformLocation(this.program, "vmax");
    this.opacityLoc = gl.getUniformLocation(this.program, "opacity");
    this.noDataLoc = gl.getUniformLocation(this.program, "nodata");

    this.vertexLoc = 0;
    gl.bindAttribLocation(this.program, this.vertexLoc, "vertex");

    this.cmapTex = gl.createTexture();
    this.cmapLoc = gl.getUniformLocation(this.program, "cmap");
    this.texLoc = gl.getUniformLocation(this.program, "tex");
    this.texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    //
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

    await this.prepareTiles();
  }

  render(gl: WebGL2RenderingContext, matrix: number[]) {
    const zoom = zoomToLevel(this.map.getZoom(), 5);
    const bounds = this.map.getBounds();
    const tiles = getTilesAtZoom(zoom, bounds);

    if (!this.loaders[zoom]) return;

    // Bind and configure texture for colormap
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE1); // Activate texture unit 1 for the colormap
    gl.bindTexture(gl.TEXTURE_2D, this.cmapTex); // Bind colormap texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB32F,
      this.cmapLength,
      1,
      0,
      gl.RGB,
      gl.FLOAT,
      this.cmap,
    );
    gl.uniform1i(this.cmapLoc, 1); // Assign to texture unit 1

    for (const ti of tiles) {
      const k = tileToKey(ti);
      const [z, x, y] = ti;
      const tile = this.tiles[k];
      if (!tile) return;
      const [scale, shiftX, shiftY] = tileToScale(z, x, y);
      gl.useProgram(this.program);

      gl.uniform1f(this.vminLoc, this.vmin);
      gl.uniform1f(this.vmaxLoc, this.vmax);
      gl.uniform1f(this.opacityLoc, this.opacity);
      gl.uniform1f(this.noDataLoc, 9.969209968386869e36);

      gl.uniformMatrix4fv(this.matrixLoc, false, matrix);

      gl.activeTexture(gl.TEXTURE0);

      // We don't await this, and just hope it finishes loading
      // by the next time we come around??
      tile.fetchData();
      if (!tile.data) return;

      gl.bindBuffer(gl.ARRAY_BUFFER, tile.tileBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, tile.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.texCoordBufferData, gl.STATIC_DRAW);

      // Bind and set texture for the tile
      gl.bindTexture(gl.TEXTURE_2D, tile.tileTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R32F,
        WIDTH,
        HEIGHT,
        0,
        gl.RED,
        gl.FLOAT,
        tile.data,
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.useProgram(this.program);

      gl.uniform1i(this.texLoc, 0);
      gl.uniform1f(this.scaleLoc, scale);
      gl.uniform1f(this.shiftXLoc, shiftX);
      gl.uniform1f(this.shiftYLoc, shiftY);

      // Enable and configure vertex attribute array
      gl.enableVertexAttribArray(this.vertexLoc);
      gl.vertexAttribPointer(this.vertexLoc, 2, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(this.texCoordLoc);
      gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

      // Enable blending and draw the tile
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
}

export default { ZarrLayer };
