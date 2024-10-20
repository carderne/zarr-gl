# zarr-gl

**WORK IN PROGRESS**

Custom WebGL Zarr layer for Mapbox and Maplibre.

Uses [zarr-js](https://github.com/freeman-lab/zarr-js) to load [Zarr](https://zarr.dev/) data into a [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/) or [Maplibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) map.

Takes inspiration from [carbonplan/maps](https://github.com/carbonplan/maps), but with two differences:
1. A library, rather than a framework.
2. Adds a [Custom Layer](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) to Mapbox's GL context, rather than creating a whole separate one.

You can see a demo at: https://zarrgl.rdrn.me

## Quickstart
```bash
npm install zarr-gl
```

```js
import zarrgl from "zarr-gl";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/standard",
  projection: "mercator",
});

const layer = new zarrgl.ZarrLayer({
  id: "myZarrLayer",
  source: "https://example.com/path/to/my.zarr",
  variable: "precip",
  colormap,
  clim: [0, 100],
  opacity: 0.8,
  map,
});
map.addLayer(layer);
```

You can see a full example in the [./demo](./demo) subdirectory.
