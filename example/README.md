# zarr-gl-example

This is a basic example demonstrating data preparation for zarr-gl and loading in a simple no-build Maplibre website.

Steps (you're welcome to skip the bits you don't need or know how to do):

1. Install [uv](https://docs.astral.sh/uv/getting-started/installation/):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Clone this repository and move to this directory:
```bash
git clone git@github.com:carderne/zarr-gl.git
cd zarr-gl/example
```

3. Install Python dependencies:
```bash
uv sync
```

4. Inspect the script at [./data_prep.py](./data_prep.py) and run it.
It will generate a simple example dataset at `./example.zarr`.
```bash
uv run python prep.py
```

5. Run a simple Python server in this directory:
```bash
uv run python -m http.server
```

6. And navigate to [localhost:8000](http://localhost:8000) in your browser. If all went well, you should see a simple red/green/blue gradient covering the world.
Take a peek at [index.html](./index.html) to see how it works.
