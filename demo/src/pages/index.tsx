import { useState } from "react";

import useColormap from "@/hooks/use-colormap";
import Mapbox from "@/components/Mapbox";
import MapLayer from "@/components/MapLayer";
import { ColorSlider } from "@/ui/color-slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Slider } from "@/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

const SOURCE = "https://weathermapdata.rdrn.me/era5_2020_num_l6.zarr";
const STYLE = "mapbox://styles/carderne/cm25xy9gj00g601pl3cpmhwhj?fresh=true";
const ACCESS_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY20yNGxpbnBsMGdxcTJqczZzZzB3YXdkZyJ9.tE9jMqijgw8GWYTvVQS4dQ";

const Index = () => {
  const [opacity, setOpacity] = useState(80);
  const [[vmin, vmax], setVminVmax] = useState<[number, number]>([0, 365]);
  const [variable, setVariable] = useState("num_wind");
  const colormap = useColormap("warm", { count: 255, mode: "dark" });

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
          colormap={colormap}
          vmin={vmin}
          vmax={vmax}
          opacity={opacity / 100}
          source={SOURCE}
          variable={variable}
        />
      </Mapbox>
      <div className="fixed left-5 top-5 flex max-w-xs flex-col space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Nice Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              How many are there where you live? A little demo of{" "}
              <a
                className="underline hover:bg-fuchsia-200"
                href="https://github.com/carderne/zarr-gl"
              >
                zarr-gl.
              </a>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col space-y-4 p-6">
            <Select defaultValue={variable} onValueChange={setVariable}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
                <SelectItem value="num_all">
                  <div>Calm, Dry, Warm Days</div>
                  <div className="text-xs">Perfect days meeting all the above criteria!</div>
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
    </div>
  );
};

export default Index;
