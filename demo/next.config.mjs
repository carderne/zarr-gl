/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  webpack: (config, _options) => {
    config.module.rules.push({
      test: /\.glsl/,
      type: "asset/source",
    });
    // Ignore .d.ts files in the parent zarr-gl dist directory
    // These get picked up by webpack's context module from dynamic imports
    config.module.rules.unshift({
      test: /\.d\.ts$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
