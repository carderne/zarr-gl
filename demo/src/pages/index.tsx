import { useState } from "react";

import useColormap from "@/hooks/use-colormap";
import Mapbox from "@/components/Mapbox";
import MapLayer from "@/components/MapLayer";
import { ColorSlider } from "@/ui/color-slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Slider } from "@/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import Highlight from "@/ui/Highlight";

const SOURCE = "https://weathermapdata.rdrn.me/era5_2020_num_l6.zarr";
const STYLE = "mapbox://styles/carderne/cm25xy9gj00g601pl3cpmhwhj?fresh=true";
const ACCESS_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY20yNGxpbnBsMGdxcTJqczZzZzB3YXdkZyJ9.tE9jMqijgw8GWYTvVQS4dQ";

const Index = () => {
  const [opacity, setOpacity] = useState(80);
  const [[vmin, vmax], setVminVmax] = useState<[number, number]>([0, 365]);
  const [variable, setVariable] = useState("num_rain");
  const colormap = useColormap("warm", { count: 255, mode: "dark" });

  const titleMap = { num_wind: "Windy", num_rain: "Rainy", num_temp: "Cold", num_all: "Crap" };
  const title = titleMap[variable as keyof typeof titleMap];

  return (
    <div className="absolute h-screen w-screen">
      <Mapbox
        accessToken={ACCESS_TOKEN}
        style={STYLE}
        zoom={3}
        center={[0, 50]}
        minZoom={3}
        debug={false}
      >
        <MapLayer
          id="weather"
          source={SOURCE}
          version="v2"
          variable={variable}
          colormap={colormap}
          vmin={vmin}
          vmax={vmax}
          opacity={opacity / 100}
        />
      </Mapbox>
      <div className="fixed flex w-screen flex-row space-x-2 p-2 md:left-5 md:top-5 md:max-w-xs md:flex-col md:space-x-0 md:space-y-4 md:p-0">
        <Card className="flex-grow">
          <CardHeader className="p-2 md:p-4 md:pb-2">
            <CardTitle className="text-center text-2xl">
              Bit <Highlight text={`${title}? ☔️`} color="#a6bddb" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 text-center md:p-4 md:pt-0">
            <p className="mx-auto text-lg">Find somewhere better!</p>
            <p className="text-sm"></p>
            <Popover>
              Click on the map for numbers and{" "}
              <PopoverTrigger>
                <Highlight text="click here for help!" color="#ffdcac" />
              </PopoverTrigger>
              <PopoverContent className="ml-8 text-sm">
                <p>Use the drop-down below to choose what matters to you.</p>
                <p>
                  Chart data shows average daily max for temperature and wind, and average daily
                  precipitation.
                </p>
                <p>Click on the map markers to make them go away again.</p>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
        <Card className="max-w-48 md:max-w-none">
          <CardContent className="flex flex-col space-y-4 p-2 md:p-4 md:py-4">
            <Select defaultValue={variable} onValueChange={setVariable}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="num_all">
                  <div>Great Days</div>
                  <div className="text-xs">Perfect days meeting all the below criteria!</div>
                </SelectItem>
                <SelectItem value="num_wind">
                  <div>Calm Days</div>
                  <div className="text-xs">Days where the wind never goes over 19 knots</div>
                </SelectItem>
                <SelectItem value="num_rain">
                  <div>Dry Days</div>
                  <div className="text-xs">Days with less than 1mm of rain</div>
                </SelectItem>
                <SelectItem value="num_temp">
                  <div>Warm Days</div>
                  <div className="text-xs">
                    Days where the max temperature is between 16 and 27 °C
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-col">
              Opacity
              <Slider
                value={[opacity]}
                min={0}
                max={100}
                step={1}
                onValueChange={(vals) => setOpacity(vals[0])}
              />
            </div>
            <div className="flex flex-col">
              Number of Days
              <ColorSlider
                value={[vmin, vmax]}
                min={0}
                max={365}
                step={1}
                minStepsBetweenThumbs={50}
                onValueChange={(vals) => setVminVmax([vals[0], vals[1]])}
                colormap={colormap}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-2 left-2 p-0 md:bottom-auto md:left-auto md:right-5 md:top-5">
        <Card className="">
          <CardContent className="p-2 md:p-4">
            <p>
              <a
                className="underline hover:bg-fuchsia-200"
                href="https://github.com/carderne/zarr-gl"
              >
                made with zarr-gl
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
