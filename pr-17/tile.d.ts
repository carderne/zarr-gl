import type { ChunkTuple, Loader } from "zarr-js";
interface TileProps {
    chunk: ChunkTuple;
    chunks: number[];
    loader: Loader;
    dimensions: string[];
    shape: number[];
    dimArrs: Record<string, number[]>;
    gl: WebGL2RenderingContext;
    z: number;
    x: number;
    y: number;
}
declare class Tile {
    chunk: ChunkTuple;
    chunks: number[];
    loader: Loader;
    dimensions: string[];
    shape: number[];
    dimArrs: Record<string, number[]>;
    data: Float32Array | null;
    dataCache: Record<string, Float32Array | null>;
    z: number;
    x: number;
    y: number;
    loading: boolean;
    tileTexture: WebGLTexture;
    vertexBuffer: WebGLBuffer;
    pixCoordBuffer: WebGLBuffer;
    constructor({ chunk, chunks, loader, dimensions, shape, dimArrs, z, x, y, gl }: TileProps);
    fetchData(selector: Record<string, number>): Promise<Float32Array>;
}
export default Tile;
