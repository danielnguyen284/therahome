import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
