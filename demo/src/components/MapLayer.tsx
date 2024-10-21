import { useMapbox } from "@/libs/use-mapbox";
import { useEffect, useState } from "react";
import { type RGB } from "@/libs/colormap";
import zarrgl from "zarr-gl";

interface MapLayerProps {
  id: string;
  source: string;
  variable: string;
  colormap: RGB[];
  vmin: number;
  vmax: number;
  opacity: number;
  display: boolean;
}

const MapLayer = ({ id, source, variable, colormap, vmin, vmax, opacity }: MapLayerProps) => {
  const { map, ready } = useMapbox();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ready && !loaded) {
      if (map.getLayer(id)) {
        console.warn("Layer already added:", id);
        return;
      }
      const layer = new zarrgl.ZarrLayer({
        id,
        source,
        variable,
        colormap,
        vmin,
        vmax,
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
