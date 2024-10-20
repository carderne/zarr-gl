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
    return config;
  },
};

export default nextConfig;
