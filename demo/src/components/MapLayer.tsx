import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { ZarrLayer } from "zarr-gl";

import { useMapbox } from "@/hooks/use-mapbox";
import { type RGB } from "@/lib/colormap";
import Marker from "./Marker";

interface MapLayerProps {
  id: string;
  source: string;
  variable: string;
  version: "v2" | "v3";
  colormap: RGB[];
  vmin: number;
  vmax: number;
  opacity?: number;
  display?: boolean;
}

const MapLayer = ({
  id,
  source,
  version,
  variable,
  colormap,
  vmin,
  vmax,
  opacity = 0.8,
}: MapLayerProps) => {
  const { map, ready } = useMapbox();
  const [layer, setLayer] = useState<ZarrLayer>();
  const [loaded, setLoaded] = useState(false);

  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest(".mapboxgl-marker")) {
        return; // Exit early if we clicked on a marker
      }

      if (!map || !layer) return;
      const point = mapboxgl.MercatorCoordinate.fromLngLat(e.lngLat);

      const adjectives = {
        num_wind: "calm",
        num_rain: "dry",
        num_warm: "warm",
        num_all: "great",
      };
      const num = await layer.getTileValue(e.lngLat.lng, e.lngLat.lat, point.x, point.y);
      const adj = adjectives[variable as keyof typeof adjectives];

      const { lng, lat } = e.lngLat;
      const container = document.createElement("div");
      const root = createRoot(container);
      const marker = new mapboxgl.Marker(container);

      const el = <Marker marker={marker} lng={lng} lat={lat} num={num} adj={adj} />;

      root.render(el);
      marker.setLngLat({ lng, lat }).addTo(map);
    },
    [map, layer, variable],
  );

  useEffect(() => {
    if (map && ready && !loaded) {
      if (map.getLayer(id)) {
        console.warn("Layer already added:", id);
        return;
      }
      const zarrLayer = new ZarrLayer({
        id,
        source,
        version,
        variable,
        map,
        colormap,
        vmin,
        vmax,
        opacity,
        invalidate: () => map.triggerRepaint(),
      });
      map.addLayer(zarrLayer, "building");
      setLayer(zarrLayer);
      setLoaded(true);
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (map && loaded) {
      map.on("click", handleMapClick);
      return () => {
        map.off("click", handleMapClick);
      };
    }
  }, [map, loaded, handleMapClick]);

  useEffect(() => {
    if (layer) {
      layer.setOpacity(opacity);
    }
  }, [map, layer, opacity]);

  useEffect(() => {
    if (layer) {
      layer.setVariable(variable);
    }
  }, [map, layer, variable]);

  useEffect(() => {
    if (layer) {
      layer.setVminVmax(vmin, vmax);
    }
  }, [map, layer, vmin, vmax]);

  return null;
};

export default MapLayer;
