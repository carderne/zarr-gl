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
    loaders: any;
    dimensions: string[];
    dimArrs: any;
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
