import { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { MapboxContext } from "@/libs/use-mapbox";

interface MapboxProps {
  children: React.ReactNode;
  accessToken: string;
  style: string;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [number, number, number, number];
}

const Mapbox = ({ children, accessToken, style, center = [0, 0], zoom = 4 }: MapboxProps) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = accessToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style,
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
      center: center,
      zoom: zoom,
      projection: "mercator",
      hash: true,
    });
    mapRef.current.showTileBoundaries = true;
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
