import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { ZarrLayer } from "zarr-gl";

import { useMapbox } from "@/hooks/use-mapbox";
import { type RGB } from "@/lib/colormap";
import Marker, { MarkerLine } from "./Marker";

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

interface HiddenLayers {
  wind: ZarrLayer;
  rain: ZarrLayer;
  temp: ZarrLayer;
  all: ZarrLayer;
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
  const [hid, setHid] = useState<HiddenLayers>();
  const [loaded, setLoaded] = useState(false);

  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest(".mapboxgl-marker")) {
        return; // Exit early if we clicked on a marker
      }

      if (!map || !hid) return;
      const point = mapboxgl.MercatorCoordinate.fromLngLat(e.lngLat);

      const windVal = await hid.wind.getTileValue(e.lngLat.lng, e.lngLat.lat, point.x, point.y);
      const rainVal = await hid.rain.getTileValue(e.lngLat.lng, e.lngLat.lat, point.x, point.y);
      const tempVal = await hid.temp.getTileValue(e.lngLat.lng, e.lngLat.lat, point.x, point.y);
      const allVal = await hid.all.getTileValue(e.lngLat.lng, e.lngLat.lat, point.x, point.y);

      const { lng, lat } = e.lngLat;
      const container = document.createElement("div");
      const root = createRoot(container);
      const marker = new mapboxgl.Marker(container);

      const el = (
        <Marker marker={marker}>
          <MarkerLine val={allVal} label="great" />
          <MarkerLine val={windVal} label="calm" />
          <MarkerLine val={rainVal} label="dry" />
          <MarkerLine val={tempVal} label="warm" />
        </Marker>
      );

      root.render(el);
      marker.setLngLat({ lng, lat }).addTo(map);
    },
    [map, hid],
  );

  useEffect(() => {
    if (map && ready && !loaded) {
      if (map.getLayer(id)) {
        console.warn("Layer already added:", id);
        return;
      }
      const basicProps = { map, source, version, colormap, vmin, vmax, opacity };
      const hidden: HiddenLayers = {
        wind: new ZarrLayer({ id: "zarr-wind", variable: "num_wind", ...basicProps }),
        rain: new ZarrLayer({ id: "zarr-rain", variable: "num_rain", ...basicProps }),
        temp: new ZarrLayer({ id: "zarr-temp", variable: "num_temp", ...basicProps }),
        all: new ZarrLayer({ id: "zarr-great", variable: "num_all", ...basicProps }),
      };
      hidden.wind.prepareTiles(false);
      hidden.rain.prepareTiles(false);
      hidden.temp.prepareTiles(false);
      hidden.all.prepareTiles(false);
      setHid(hidden);
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
