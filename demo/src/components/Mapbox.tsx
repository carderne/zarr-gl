import { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { MapboxContext } from "@/hooks/use-mapbox";

interface MapboxProps {
  children: React.ReactNode;
  accessToken: string;
  style: string;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [number, number, number, number];
  debug?: boolean;
}

const Mapbox = ({
  children,
  accessToken,
  style,
  center = [0, 0],
  zoom = 4,
  minZoom = 1,
  maxZoom = 10,
  maxBounds = null,
  debug = false,
}: MapboxProps) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = accessToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style,
      center,
      zoom,
      minZoom,
      maxZoom,
      maxBounds,
      projection: "mercator",
      hash: true,
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
    });
    mapRef.current.showTileBoundaries = debug;
    mapRef.current.on("styledata", () => {
      setReady(true);
    });

    return () => {
      mapRef.current.remove();
      setReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MapboxContext.Provider value={{ map: mapRef.current, ready }}>
      <div className="absolute h-screen w-screen" ref={mapContainerRef} />
      {ready && children}
    </MapboxContext.Provider>
  );
};

export default Mapbox;
