import { createContext, useContext } from "react";

interface MapboxContextType {
  map: mapboxgl.Map | undefined;
  ready: boolean;
}

export const MapboxContext = createContext<MapboxContextType>({ map: undefined, ready: false });

export const useMapbox = () => {
  return useContext(MapboxContext);
};
