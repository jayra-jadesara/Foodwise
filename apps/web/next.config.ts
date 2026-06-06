import withPWA from "next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL: Required for Capacitor mobile builds
  output: 'export', 
  
  // Required because native apps don't have an image optimization server
  images: {
    unoptimized: true,
  },

  transpilePackages: [
    "@mui/material",
    "@mui/system",
    "@mui/icons-material",
  ],

  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);