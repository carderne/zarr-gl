import xarray as xr
import numpy as np
from ndpyramid import pyramid_reproject
import rioxarray  # noqa

x = np.arange(-180, 180, 0.25)
y = np.arange(-90, 90.25, 0.25)
da = xr.DataArray(
    data=np.ones((len(y), len(x))),
    coords={"y": y, "x": x},
    dims=["y", "x"],
    name="my_array",
)
da = da * (np.abs(da.y) + np.abs(da.x) + 1)

ds = xr.Dataset({"my_array": da})
ds = ds.rio.write_crs("EPSG:4326")

pyramids = pyramid_reproject(ds, levels=6, resampling="bilinear")
pyramids.to_zarr("./example.zarr", consolidated=True, mode="w")
