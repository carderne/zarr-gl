import { useCallback, useState } from "react";
import { Button } from "@/ui/button";

import { getWeatherData, type Monthly } from "@/lib/openmeteo";
import WeatherChart from "./WeatherChart";
import { ChevronDown, ChevronUp } from "lucide-react";
import Highlight from "@/ui/Highlight";

const ACCESS_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY20yNGxpbnBsMGdxcTJqczZzZzB3YXdkZyJ9.tE9jMqijgw8GWYTvVQS4dQ";

const lookupPlace = async (lng: number, lat: number): Promise<string> => {
  const useLng = Math.round(lng * 100) / 100;
  const useLat = Math.round(lat * 100) / 100;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${useLng},${useLat}.json?types=place,locality,neighborhood,district&access_token=${ACCESS_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch location: ${response.statusText}`);
  }
  const data = await response.json();
  return data.features[0]?.text;
};

const Marker = ({
  marker,
  lng,
  lat,
  num,
  adj,
}: {
  marker: mapboxgl.Marker;
  lng: number;
  lat: number;
  num: number;
  adj: string;
}) => {
  const [data, setData] = useState<Monthly[]>();
  const [chartIsVisible, setChartIsVisible] = useState(false);
  const [place, setPlace] = useState<string>();

  const close = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    marker.remove();
  };

  const showChart = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!data) {
        const startDate = "2015-01-01";
        const endDate = "2024-01-01";
        const res = await getWeatherData({ lat, lng, startDate, endDate });
        setData(res);

        const pl = await lookupPlace(lng, lat);
        setPlace(pl);
      }
      setChartIsVisible(!chartIsVisible);
    },
    [chartIsVisible, data, lat, lng],
  );

  const buttonText = chartIsVisible ? "Chart" : "Chart";
  const buttonIcon = chartIsVisible ? <ChevronDown /> : <ChevronUp />;

  return (
    <div onClick={close} className="-translate-y-[calc(50%+12px)] transform cursor-pointer">
      <div className="relative flex flex-col rounded-lg bg-white bg-opacity-90 p-2 shadow-lg">
        <div className="mb-2 flex flex-col">
          <div className="m-auto text-xl">
            {num} <Highlight text={adj} color="#ffdcac" /> days
          </div>
          <div className="text-md m-auto max-w-80">
            {chartIsVisible && place && place.length > 1 && <span>in {place}</span>}
          </div>
        </div>
        {data && chartIsVisible && (
          <div className="w-80">
            <WeatherChart data={data} />
          </div>
        )}
        <Button onClick={showChart} variant="outline" className="m-auto w-32">
          {buttonText}
          {buttonIcon}
        </Button>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full transform">
          <div
            className="h-0 w-0 border-b-0 border-l-[8px] border-r-[8px] border-t-[10px] border-solid border-l-transparent border-r-transparent border-t-white border-opacity-90"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Marker;
