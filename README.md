# zarr-gl

Custom WebGL Zarr layer for Mapbox and Maplibre.

This library allows you to load [Zarr](https://zarr.dev/) data into a [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/) or [Maplibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) map.

Takes inspiration from [carbonplan/maps](https://github.com/carbonplan/maps), but with two differences:
1. A library, rather than a framework, so you can use it how you like.
2. Adds a [Custom Layer](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) to Mapbox's GL context, rather than creating a whole separate one. Allows you to mix and match with Map styles, adjust layer ordering etc.

You can see a demo at: [zarrgl.rdrn.me](http://zarrgl.rdrn.me).

## Quickstart
```bash
npm install zarr-gl
```

```js
import { ZarrLayer } from "zarr-gl";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/standard",
  projection: "mercator",
});

const layer = new ZarrLayer({
  id: "myZarrLayer",
  source: "https://example.com/path/to/my.zarr",
  variable: "precip",
  colormap: [[200, 10, 50], [30, 40, 30], [50, 10, 200]],
  clim: [0, 100],
  opacity: 0.8,
  map,
});
map.addLayer(layer);
```

## Examples
1. There is a very basic example (including data prep) in the [example](./example) directory.
2. There's also a more complex React app inside [demo](./demo) and viewable at [zarrgl.rdrn.me](http://zarrgl.rdrn.me).
