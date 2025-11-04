# zarr-gl

Custom WebGL Zarr layer for Mapbox and Maplibre.

This library allows you to load [Zarr](https://zarr.dev/) data into a [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/) or [Maplibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) map.

Takes inspiration from [carbonplan/maps](https://github.com/carbonplan/maps), but with two differences:
1. A library, rather than a framework, so you can use it how you like.
2. Adds a [Custom Layer](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) to Mapbox's GL context, rather than creating a whole separate one. Allows you to mix and match with Map styles, adjust layer ordering etc.

You can see a demo at: [rainy.rdrn.me](http://rainy.rdrn.me).

<img width="824" alt="image" src="https://github.com/user-attachments/assets/0414dcd2-2b1f-4e1a-aea8-a2b715fcab56">


## Quickstart
```bash
npm install zarr-gl
```

You'll need to prepare the data using [carbonplan/ndpyramid](https://github.com/carbonplan/ndpyramid).
Hoping to make that unnecessary at least for use-cases where a narrow zoom-range works.
There's a basic data preparation example at [example/prep.py](./example/prep.py).

```js
import { ZarrLayer } from "zarr-gl";
// or skip the npm install and just do this:
// import { ZarrLayer } from "https://cdn.jsdelivr.net/npm/zarr-gl@0.2.0/+esm";

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
  vmin: 0,
  vmax: 100,
  opacity: 0.8,
  map,
});
map.addLayer(layer);
```

## Roadmap
- [x] Support a `selector` option to index into additional dimensions. Currently only 2D datasets are supported.
- [ ] Reproject from lon/lat to EPSG:3857 on the fly
- [ ] Handle chunk sizes other than 128x128.
- [ ] Appropriately handle non-float32 data.
- [ ] Add more lifecycle events.

## Examples
1. There is a very basic example (including data prep) in the [example](./example) directory.
2. There's also a more complex React app inside [demo](./demo) and viewable at [rainy.rdrn.me](http://rainy.rdrn.me).

## Contributing
I'd love input on use-cases, ideas, missing features etc.
Even better if they come with code.

### Testing Pull Requests
When you open a pull request, a preview build is automatically created and deployed. You can test the PR changes by using the preview link posted in the PR comments. This allows you to test changes before they are merged, using imports like:

```js
// Option 1: jsDelivr with /+esm (recommended - same as npm package usage)
import { ZarrLayer } from "https://cdn.jsdelivr.net/gh/james-willis/zarr-gl@gh-pages/pr-{number}/+esm";

// Option 2: esm.sh CDN
import { ZarrLayer } from "https://esm.sh/gh/james-willis/zarr-gl@gh-pages/pr-{number}/zarr-gl.js";
```

Replace `{number}` with the actual PR number, or just copy the link from the automated comment on your PR.
