import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isMobile = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // ✅ Only use 'export' when building for Android/iOS
  // This allows Vercel to work normally as a Web Server
  output: isMobile ? 'export' : undefined, 

  images: {
    unoptimized: true,
  },
  
  transpilePackages: ["@mui/material", "@mui/system", "@mui/icons-material"],
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);