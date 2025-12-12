import type { Loader } from "zarr-js";
import type { RequestParameters } from "./index";
declare const loadZarrV2: (source: string, variable: string, transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>) => Promise<{
    loaders: Record<string, Loader>;
    dimensions: string[];
    dimArrs: {
        [k: string]: number[];
    };
    levels: number[];
    maxZoom: number;
    tileSize: number;
    crs: string;
    shape: number[];
    chunks: number[];
    fillValue: number;
}>;
declare const loadZarr: (source: string, variable: string, version: "v2" | "v3", transformRequest?: (url: string) => RequestParameters | Promise<RequestParameters>) => ReturnType<typeof loadZarrV2>;
export default loadZarr;
