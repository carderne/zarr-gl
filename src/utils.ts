export type TileTuple = [number, number, number];

export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
}

export const getTilesAtZoom = (
  zoom: number,
  bounds: mapboxgl.LngLatBounds,
): TileTuple[] => {
  const [[west, south], [east, north]] = bounds.toArray();
  const nwX = lon2tile(west, zoom);
  const seX = lon2tile(east, zoom);
  const nwY = lat2tile(north, zoom);
  const seY = lat2tile(south, zoom);

  const tiles: TileTuple[] = [];
  for (let x = nwX; x <= seX; x++) {
    for (let y = nwY; y <= seY; y++) {
      tiles.push([zoom, x, y]);
    }
  }

  return tiles;
};

export const keyToTile = (key: string): TileTuple => {
  return key.split(",").map((d) => parseInt(d)) as TileTuple;
};

export const tileToKey = (tile: TileTuple): string => {
  return tile.join(",");
};

export const tileToScale = (tile: TileTuple): [number, number, number] => {
  const [z, x, y] = tile;
  const scale = 1 / 2 ** z;
  const shiftX = x * scale;
  const shiftY = y * scale;
  return [scale, shiftX, shiftY];
};

export const zoomToLevel = (zoom: number, maxZoom: number): number => {
  if (maxZoom) return Math.min(Math.max(3, Math.floor(zoom)), maxZoom);
  return Math.max(0, Math.floor(zoom));
};

export const createShader = (
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string,
): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error(`createShader failed ${type}`);
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    const msg = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Failed to create shader ${type}: ${msg}`);
  }
  return shader;
};

export const createProgram = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram => {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("createProgram failed");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const msg = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Failed to create program: ${msg}`);
  }
  return program;
};

export const mustGetUniformLocation = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation => {
  const loc = gl.getUniformLocation(program, name);
  if (!loc) {
    throw new Error(`Failed to get Uniform Location for ${name}`);
  }
  return loc;
};

export const mustCreateTexture = (gl: WebGL2RenderingContext): WebGLTexture => {
  const tex = gl.createTexture();
  if (!tex) {
    throw new Error("Failed to create texture");
  }
  return tex;
};

export const mustCreateBuffer = (gl: WebGL2RenderingContext): WebGLBuffer => {
  const buf = gl.createBuffer();
  if (!buf) {
    throw new Error("Failed to create buffer");
  }
  return buf;
};

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
