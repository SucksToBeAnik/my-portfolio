import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Rewrites barrel imports to per-icon imports so the whole icon set
    // never lands in a route bundle.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
