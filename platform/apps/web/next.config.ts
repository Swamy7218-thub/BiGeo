import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: { serverComponentsExternalPackages: [] },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_MAP_TILE: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
};

export default nextConfig;
