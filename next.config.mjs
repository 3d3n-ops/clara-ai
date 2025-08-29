/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      "node-fetch": "commonjs node-fetch",
    });
    return config;
  },
};

export default nextConfig;
