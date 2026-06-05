import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@mui/material", "@mui/system", "@mui/icons-material"],
  // Required for Capacitor mobile support
  images: {
    unoptimized: true, 
  },
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
};

export default nextConfig;