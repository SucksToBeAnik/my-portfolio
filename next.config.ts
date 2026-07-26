import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Rewrites barrel imports to per-icon imports so the whole icon set
    // never lands in a route bundle.
    optimizePackageImports: ["@phosphor-icons/react"],
    // Turbopack's on-disk dev cache is memory-mapped at startup, so a grown
    // cache in .next/dev/cache shows up directly as dev-server RSS (it hit
    // 7.5 GB / 7 GB resident here). Off: slower warm restarts, bounded memory.
    turbopackFileSystemCacheForDev: false,
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
