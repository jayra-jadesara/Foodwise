import withPWA from "next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mui/material",
    "@mui/system",
    "@mui/icons-material",
  ],

  images: {
    unoptimized: true,
  },

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
})(nextConfig);