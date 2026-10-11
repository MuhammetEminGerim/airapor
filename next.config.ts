import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  onDemandEntries: {
    // Keep entries warm longer in dev to reduce intermittent chunk reload issues.
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 5,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer && config.output) {
      // Webpack default is 120s; slower dev recompiles can trigger false ChunkLoadError.
      config.output.chunkLoadTimeout = 5 * 60 * 1000
    }
    return config
  },
};

export default nextConfig;
