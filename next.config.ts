import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.localhost"],
  turbopack: {
    root: "../",
  },
};

export default nextConfig;
