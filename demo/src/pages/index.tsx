import { useState } from "react";
import useColormap from "@/libs/use-colormap";
import Mapbox from "@/components/Mapbox";
import MapLayer from "@/components/MapLayer";

const source = "https://weathermapdata.rdrn.me/era5_2020_num_l6_land.zarr";

const Index = () => {
  const [display] = useState(true);
  const [opacity] = useState(0.8);
  const [clim] = useState<[number, number]>([1, 200]);
  const [band] = useState("wind_ok");
  const colormap = useColormap("rainbow", { count: 10, mode: "light" });

  return (
    <div style={{ position: "absolute", width: "100vw", height: "100vh" }}>
      <Mapbox
        accessToken="pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY20yNGxpbnBsMGdxcTJqczZzZzB3YXdkZyJ9.tE9jMqijgw8GWYTvVQS4dQ"
        style="mapbox://styles/carderne/cm25xy9gj00g601pl3cpmhwhj"
        zoom={3}
        center={[0, 50]}
      >
        <MapLayer
          id="fancy"
          colormap={colormap}
          clim={clim}
          display={display}
          opacity={opacity}
          source={source}
          variable={band}
        />
      </Mapbox>
    </div>
  );
};

export default Index;
