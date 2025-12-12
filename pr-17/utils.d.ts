import { ChunkTuple } from "zarr-js";
export type TileTuple = [number, number, number];
export declare function lon2tile(lon: number, zoom: number): number;
export declare function lat2tile(lat: number, zoom: number): number;
export declare const getTilesAtZoom: (zoom: number, bounds: [[number, number], [number, number]]) => TileTuple[];
export declare const keyToTile: (key: string) => TileTuple;
export declare const tileToKey: (tile: TileTuple) => string;
export declare const tileToScale: (tile: TileTuple) => [number, number, number];
export declare const zoomToLevel: (zoom: number, maxZoom: number) => number;
export declare const createShader: (gl: WebGL2RenderingContext, type: GLenum, source: string) => WebGLShader;
export declare const createProgram: (gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => WebGLProgram;
export declare const mustGetUniformLocation: (gl: WebGL2RenderingContext, program: WebGLProgram, name: string) => WebGLUniformLocation;
export declare const mustCreateTexture: (gl: WebGL2RenderingContext) => WebGLTexture;
export declare const mustCreateBuffer: (gl: WebGL2RenderingContext) => WebGLBuffer;
export declare const mustCreateFramebuffer: (gl: WebGL2RenderingContext, width: number, height: number) => {
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
};
export declare const getChunks: ({ selector, dimensions, dimArrs, shape, chunks, x, y, }: {
    selector: Record<string, number>;
    dimensions: string[];
    dimArrs: Record<string, number[]>;
    shape: number[];
    chunks: number[];
    x: number;
    y: number;
}) => ChunkTuple[];
