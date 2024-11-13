import type { Map } from "mapbox-gl";
import {
  zoomToLevel,
  tileToScale,
  createShader,
  createProgram,
  getTilesAtZoom,
  tileToKey,
  TileTuple,
  lat2tile,
  lon2tile,
  mustGetUniformLocation,
  mustCreateTexture,
  mustCreateFramebuffer,
  mustCreateBuffer,
} from "./utils";
import type { ChunkTuple, Loader } from "zarr-js";
import Tile from "./tile";
import zarrLoad from "./store";
import fragmentSource from "./shaders/frag.glsl";
import vertexSource from "./shaders/vert.glsl";
import renderFragmentSource from "./shaders/renderFrag.glsl";
import renderVertexSource from "./shaders/renderVert.glsl";

type RGB = [number, number, number];

// TODO handle different tile/chunk shapes
const TILE_WIDTH = 128;
const TILE_HEIGHT = 128;

export interface ZarrLayerProps {
  map: Map;
  id: string; // id for the layer, must be unique
  source: string; // Zarr source URL
  version: "v2" | "v3"; // Zarr version
  variable: string; // Zarr variable to display
  selector: Record<string, number>; // index into dimensions
  colormap: RGB[]; // array of RGB triplets in 0-255
  vmin: number; // lower bound for colormap
  vmax: number; // upper bound for colormap
  opacity?: number;
  minRenderZoom?: number;
  invalidate?: () => void;
}

export class ZarrLayer {
  type: "custom";
  renderingMode: "2d";

  map: Map;
  id: string;
  zarrSource: string;
  zarrVersion: "v2" | "v3";
  variable: string;
  selector: Record<string, number>;
  invalidate: () => void;

  cmapLength: number;
  cmap: Float32Array;
  vmin: number;
  vmax: number;
  opacity: number;
  minRenderZoom: number;

  loaders: Record<string, Loader>;
  tiles: Record<string, Tile>;
  maxZoom: number;
  fillValue: number;

  private gl: WebGL2RenderingContext | undefined;
  private program: WebGLProgram;

  private scaleLoc: WebGLUniformLocation;
  private shiftXLoc: WebGLUniformLocation;
  private shiftYLoc: WebGLUniformLocation;
  private matrixLoc: WebGLUniformLocation;

  private vminLoc: WebGLUniformLocation;
  private vmaxLoc: WebGLUniformLocation;
  private opacityLoc: WebGLUniformLocation;
  private noDataLoc: WebGLUniformLocation;

  private vertexLoc: number;
  private cmapTex: WebGLTexture;
  private cmapLoc: WebGLUniformLocation;

  private vertexArr: Float32Array;
  private pixCoordArr: Float32Array;

  private texLoc: WebGLUniformLocation;
  private pixCoordLoc: GLint;

  private frameBuffers: {
    current: {
      framebuffer: WebGLFramebuffer;
      texture: WebGLTexture;
    } | null;
    next: {
      framebuffer: WebGLFramebuffer;
      texture: WebGLTexture;
    } | null;
  };
  private isUpdating: boolean;
  private canvasWidth: number;
  private canvasHeight: number;

  private renderProgram: WebGLProgram;
  private renderVertexLoc: number;
  private renderTexLoc: WebGLUniformLocation;
  private vertexBuffer: WebGLBuffer;

  constructor({
    id,
    source,
    version,
    variable,
    selector,
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
    this.zarrVersion = version;
    this.variable = variable;
    this.selector = selector ?? {};

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

    this.frameBuffers = { current: null, next: null };
    this.isUpdating = false;
    this.canvasWidth = 512; // Default size, will be updated
    this.canvasHeight = 512;
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
    this.getVisibleTiles();
    await this.prefetchTileData();
    this.invalidate();
  }

  async setSelector(selector: Record<string, number>) {
    this.selector = selector;
    this.tiles = {};
    await this.prepareTiles();
    this.getVisibleTiles();
    await this.prefetchTileData();
    this.invalidate();
  }

  async prefetchTileData() {
    const tiles = this.getVisibleTiles();
    for (const tiletuple of tiles) {
      const tilekey = tileToKey(tiletuple);
      const tile = this.tiles[tilekey];
      if (tile) {
        await tile.fetchData();
      }
    }
  }

  getVisibleTiles(): TileTuple[] {
    const zoom = zoomToLevel(this.map.getZoom(), 4); // TODO use max zoom level from Zarr

    // If we don't have a loader for this zoom level just give up...
    if (!this.loaders[zoom]) return [];

    const bounds = this.map.getBounds()?.toArray();
    if (!bounds) {
      throw new Error("Couldn't get map bounds");
    }
    const tiles = getTilesAtZoom(zoom, bounds);
    return tiles;
  }

  async prepareTiles() {
    if (typeof this.gl === "undefined") {
      throw new Error("Cant prepareTiles with no GL context set");
    }
    const gl = this.gl;
    const {
      loaders,
      dimensions,
      dimArrs,
      levels,
      maxZoom,
      shape,
      chunks,
      fillValue,
    } = await zarrLoad(this.zarrSource, this.variable, this.zarrVersion);

    // TODO check if selector references non-existent dimensions

    this.maxZoom = maxZoom;
    this.fillValue = fillValue;
    levels.forEach((z: number) => {
      const loaderKey = z + "/" + this.variable;
      const loader = loaders[loaderKey];
      if (!loader) {
        throw new Error(`Failed to get loader for ${loaderKey}`);
      }
      this.loaders[z] = loader;
      Array.from({ length: Math.pow(2, z) }, (_, x) => {
        Array.from({ length: Math.pow(2, z) }, (_, y) => {
          const key = [z, x, y].join(",");
          const chunk: ChunkTuple = [y, x]; // NOTE: chunks go [Y, X]
          // TODO most of these probably dont need to go into Tile
          this.tiles[key] = new Tile({
            chunk,
            chunks,
            loader,
            gl,
            dimensions,
            dimArrs,
            shape,
            selector: this.selector,
            z,
            x,
            y,
          });
        });
      });
    });
  }

  async getTileValue(
    lng: number,
    lat: number,
    x: number,
    y: number,
  ): Promise<number> {
    const zoom = this.maxZoom;
    const tileTuple: TileTuple = [
      zoom,
      lon2tile(lng, zoom),
      lat2tile(lat, zoom),
    ];
    const tileKey = tileToKey(tileTuple);
    const tile = this.tiles[tileKey];
    if (tile) {
      const [_, shiftX, shiftY] = tileToScale(tileTuple);
      const [xLocal, yLocal] = [x - shiftX, y - shiftY];
      const data = await tile.fetchData();
      const [xIndex, yIndex] = [
        Math.round(xLocal * TILE_WIDTH * 2 ** zoom),
        Math.round(yLocal * TILE_HEIGHT * 2 ** zoom),
      ];
      const index = yIndex * TILE_WIDTH + xIndex;
      const val = data[index];
      if (val) {
        return val;
      }
    }
    return -1;
  }

  async onAdd(_map: Map, gl: WebGL2RenderingContext) {
    this.gl = gl;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    this.program = createProgram(gl, vertexShader, fragmentShader);

    this.scaleLoc = mustGetUniformLocation(gl, this.program, "scale");
    this.shiftXLoc = mustGetUniformLocation(gl, this.program, "shift_x");
    this.shiftYLoc = mustGetUniformLocation(gl, this.program, "shift_y");
    this.matrixLoc = mustGetUniformLocation(gl, this.program, "matrix");

    this.vminLoc = mustGetUniformLocation(gl, this.program, "vmin");
    this.vmaxLoc = mustGetUniformLocation(gl, this.program, "vmax");
    this.opacityLoc = mustGetUniformLocation(gl, this.program, "opacity");
    this.noDataLoc = mustGetUniformLocation(gl, this.program, "nodata");

    // There is a single global texture for the colormap
    this.cmapTex = mustCreateTexture(gl);
    this.cmapLoc = mustGetUniformLocation(gl, this.program, "cmap");

    // The texture for each tile is created in the Tile constructor
    this.texLoc = mustGetUniformLocation(gl, this.program, "tex");

    // The `vertex` controls the location for the vertex shader
    this.vertexLoc = gl.getAttribLocation(this.program, "vertex");
    // prettier-ignore
    this.vertexArr = new Float32Array([
      -1.0,  1.0, // left top
      -1.0, -1.0, // left bottom
       1.0,  1.0, // right top
       1.0, -1.0, // right bottom
    ]);

    // While this texCoord controls the fragment shader pixel "lookup"
    this.pixCoordLoc = gl.getAttribLocation(this.program, "pix_coord_in");
    // prettier-ignore
    this.pixCoordArr = new Float32Array([
      0.0, 0.0, // left side
      0.0, 1.0,
      1.0, 0.0, // right side
      1.0, 1.0,
    ]);

    this.canvasWidth = gl.canvas.width;
    this.canvasHeight = gl.canvas.height;
    this.frameBuffers.current = mustCreateFramebuffer(
      gl,
      this.canvasWidth,
      this.canvasHeight,
    );
    this.frameBuffers.next = mustCreateFramebuffer(
      gl,
      this.canvasWidth,
      this.canvasHeight,
    );

    await this.prepareTiles();

    this.vertexBuffer = mustCreateBuffer(gl);

    const renderVertShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      renderVertexSource,
    );

    const renderFragShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      renderFragmentSource,
    );

    this.renderProgram = createProgram(gl, renderVertShader, renderFragShader);
    this.renderVertexLoc = gl.getAttribLocation(this.renderProgram, "vertex");
    this.renderTexLoc = mustGetUniformLocation(gl, this.renderProgram, "tex");

    // Clean up shaders
    gl.deleteShader(renderVertShader);
    gl.deleteShader(renderFragShader);
  }

  prerender(gl: WebGL2RenderingContext, matrix: number[]) {
    if (this.isUpdating) return;

    // Check if canvas size has changed
    gl.useProgram(this.program);
    if (
      gl.canvas.width !== this.canvasWidth ||
      gl.canvas.height !== this.canvasHeight
    ) {
      this.canvasWidth = gl.canvas.width;
      this.canvasHeight = gl.canvas.height;
      this.frameBuffers.current = mustCreateFramebuffer(
        gl,
        this.canvasWidth,
        this.canvasHeight,
      );
      this.frameBuffers.next = mustCreateFramebuffer(
        gl,
        this.canvasWidth,
        this.canvasHeight,
      );
    }

    // First copy the current framebuffer to the next one
    // prettier-ignore
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.frameBuffers.next!.framebuffer);
    // prettier-ignore
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffers.current!.framebuffer);
    // prettier-ignore
    gl.blitFramebuffer(0, 0, this.canvasWidth, this.canvasHeight, 0, 0, this.canvasWidth, this.canvasHeight, gl.COLOR_BUFFER_BIT, gl.NEAREST);

    // Render to the next buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers.next!.framebuffer);
    gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

    // Call useProgram once right at the start
    gl.clearColor(0, 0, 0, 0);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // This is the colormap
    // First activate TEXTURE1, bind the unofirm, set the parameters
    // and then upload the texture
    // Important that these happen in roughly this order!
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.cmapTex);
    gl.uniform1i(this.cmapLoc, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // iOS Safari only supports RGB16F
    // prettier-ignore
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, this.cmapLength, 1, 0, gl.RGB, gl.FLOAT, this.cmap);

    // Set the basic uniforms for color handling
    gl.uniform1f(this.vminLoc, this.vmin);
    gl.uniform1f(this.vmaxLoc, this.vmax);
    gl.uniform1f(this.opacityLoc, this.opacity);
    gl.uniform1f(this.noDataLoc, this.fillValue);

    // The Mapbox matrix maps map-space coordinates to GLSL-space
    gl.uniformMatrix4fv(this.matrixLoc, false, matrix);

    const tiles = this.getVisibleTiles();
    // We don't await this, and just hope it finishes loading
    // by the next time we come around??
    // This is because Mapbox/WebGL doesn't like it if we await here
    // and all sorts of weird stuff happens
    this.prefetchTileData();

    for (const tileTuple of tiles) {
      const tileKey = tileToKey(tileTuple);
      const tile = this.tiles[tileKey];
      if (!tile) continue;

      // We don't await this, and just hope it finishes loading
      // by the next time we come around??
      // This is because Mapbox/WebGL doesn't like it if we await here
      // and all sorts of weird stuff happens
      if (!tile.data) continue;

      // These are used to scale and shift the this.bufferData
      // coordinates from covering the whole canvas to just the part
      // that the tile covers
      const [scale, shiftX, shiftY] = tileToScale(tileTuple);
      gl.uniform1f(this.scaleLoc, scale);
      gl.uniform1f(this.shiftXLoc, shiftX);
      gl.uniform1f(this.shiftYLoc, shiftY);

      // For some reason it is quite important for these two bind+buffer
      // to happen before the texture stuff
      gl.bindBuffer(gl.ARRAY_BUFFER, tile.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexArr, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, tile.pixCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.pixCoordArr, gl.STATIC_DRAW);

      // Bind and set texture for the tile
      // As with cmap, the order here is important
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tile.tileTexture);
      gl.uniform1i(this.texLoc, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // iOS Safari only supports RGB16F
      // prettier-ignore
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, TILE_WIDTH, TILE_HEIGHT, 0, gl.RED, gl.FLOAT, tile.data);

      // These are the vertex and pixCoord that were buffered+bound
      // further up. For some reason this has to happen _after_ the
      // texture stuff??
      gl.enableVertexAttribArray(this.vertexLoc);
      gl.vertexAttribPointer(this.vertexLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.pixCoordLoc);
      gl.vertexAttribPointer(this.pixCoordLoc, 2, gl.FLOAT, false, 0, 0);

      // Enable blending and draw the tile
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Swap buffers
    const temp = this.frameBuffers.current;
    this.frameBuffers.current = this.frameBuffers.next;
    this.frameBuffers.next = temp;

    this.isUpdating = false;
  }

  render(gl: WebGL2RenderingContext, _matrix: number[]) {
    if (!this.frameBuffers.current) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

    gl.useProgram(this.renderProgram);

    // Bind the framebuffer texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.frameBuffers.current.texture);
    gl.uniform1i(this.renderTexLoc, 0);

    // Set up vertices for a full-screen quad
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(this.renderVertexLoc);
    gl.vertexAttribPointer(this.renderVertexLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
