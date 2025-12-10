import { ChunkTuple } from "zarr-js";

export type TileTuple = [number, number, number];

export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
}

export const getTilesAtZoom = (
  zoom: number,
  bounds: [[number, number], [number, number]],
): TileTuple[] => {
  const [[west, south], [east, north]] = bounds;
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

export const mustCreateFramebuffer = (
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
): { framebuffer: WebGLFramebuffer; texture: WebGLTexture } => {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    throw new Error("Failed to create framebuffer");
  }

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Failed to create texture for framebuffer");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  return { framebuffer, texture };
};

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getChunks = ({
  selector,
  dimensions,
  dimArrs,
  shape,
  chunks,
  x,
  y,
}: {
  selector: Record<string, number>;
  dimensions: string[];
  dimArrs: Record<string, number[]>;
  shape: number[];
  chunks: number[];
  x: number;
  y: number;
}): ChunkTuple[] => {
  return dimensions.reduce<ChunkTuple[]>(
    (acc, dim, i) => {
      if (["x", "lon"].includes(dim)) {
        return acc.flatMap((a) => [[...a, x]]);
      } else if (["y", "lat"].includes(dim)) {
        return acc.flatMap((tuple) => [[...tuple, y]]);
      }

      const chunkSize = chunks[i];
      const coords = dimArrs[dim];
      if (typeof chunkSize === "undefined" || typeof coords === "undefined") {
        throw new Error("Need at least 1D array");
      }

      const selectorValue = selector[dim];
      const indices = Array.isArray(selectorValue)
        ? selectorValue.map((v) => coords.indexOf(v))
        : selectorValue !== undefined
          ? [coords.indexOf(selectorValue)]
          : Array.from({ length: shape[i]! }, (_, j) => j);

      const uniqueChunkIndices = [
        ...new Set(indices.map((index) => Math.floor(index / chunkSize))),
      ];

      return acc.flatMap((a) => uniqueChunkIndices.map((chunkIndex) => [...a, chunkIndex]));
    },
    [[]],
  );
};
