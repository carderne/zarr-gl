import { useMapbox } from "@/libs/use-mapbox";
import { useEffect, useState } from "react";
import { type RGB } from "@/libs/colormap";
import zarrgl from "zarr-gl";

interface MapLayerProps {
  id: string;
  source: string;
  variable: string;
  colormap: RGB[];
  clim: [number, number];
  display: boolean;
  opacity: number;
}

const MapLayer = ({ id, source, variable, colormap, clim, opacity }: MapLayerProps) => {
  const { map, ready } = useMapbox();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ready && !loaded) {
      if (map.getLayer(id)) {
        console.warn("Layer already added:", id);
        return;
      }
      const layer = new zarrgl.CustomLayer({
        id,
        source,
        variable,
        colormap,
        clim,
        opacity,
        map,
      });
      map.addLayer(layer, "building");
      setLoaded(true);
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default MapLayer;
