import type { Array as ZarrArray, DataType } from "zarrita";
import * as zarr from "zarrita";
export interface MultiscaleDataset {
    path: string;
    pixels_per_tile?: number;
    crs?: string;
}
export interface Multiscale {
    datasets: MultiscaleDataset[];
}
export interface RequestParameters {
    url: string;
    headers?: {
        [key: string]: string;
    };
    credentials?: RequestCredentials;
}
declare const loadZarrVersion: (source: string, variable: string, transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>) => Promise<{
    loaders: Record<string, ZarrArray<DataType, zarr.Readable>>;
    dimensions: string[];
    dimArrs: Record<string, number[]>;
    levels: number[];
    maxZoom: number;
    tileSize: number;
    crs: string;
    shape: number[];
    chunks: number[];
    fillValue: number;
}>;
declare const loadZarr: (source: string, variable: string, transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>) => ReturnType<typeof loadZarrVersion>;
export default loadZarr;
