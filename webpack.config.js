import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webpackConfig = (env, argv) => {
  const isDev = argv.mode === "development";

  return {
    entry: "./src/index.ts",
    devtool: isDev ? "source-map" : false,
    mode: argv.mode || "production",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.glsl$/,
          type: "asset/source",
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".glsl"],
      fallback: { buffer: false },
    },
    experiments: {
      outputModule: true,
    },
    target: ["web", "es2020"],
    optimization: {
      minimize: !isDev,
    },
    output: {
      filename: "zarr-gl.js",
      path: path.resolve(__dirname, "dist"),
      library: {
        type: "module",
      },
      module: true,
      environment: {
        module: true,
      },
      chunkFormat: "module",
      clean: true,
    },
  };
};

export default webpackConfig;
