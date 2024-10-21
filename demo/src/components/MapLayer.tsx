import { useEffect, useState } from "react";
import zarrgl from "zarr-gl";

import { useMapbox } from "@/hooks/use-mapbox";
import { type RGB } from "@/lib/colormap";

interface MapLayerProps {
  id: string;
  source: string;
  variable: string;
  colormap: RGB[];
  vmin: number;
  vmax: number;
  opacity?: number;
  display?: boolean;
}

const MapLayer = ({ id, source, variable, colormap, vmin, vmax, opacity = 0.8 }: MapLayerProps) => {
  const { map, ready } = useMapbox();
  const [layer, setLayer] = useState<any>(); //eslint-disable-line @typescript-eslint/no-explicit-any
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ready && !loaded) {
      if (map.getLayer(id)) {
        console.warn("Layer already added:", id);
        return;
      }
      const zarrLayer = new zarrgl.ZarrLayer({
        id,
        source,
        variable,
        colormap,
        vmin,
        vmax,
        opacity,
        map,
      });
      map.addLayer(zarrLayer, "building");
      setLayer(zarrLayer);
      setLoaded(true);
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (layer) {
      layer.setOpacity(opacity);
      map.triggerRepaint();
    }
  }, [map, layer, opacity]);

  return null;
};

export default MapLayer;
