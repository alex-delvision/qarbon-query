import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Enable image optimization for better performance on Vercel
    unoptimized: false,
    // Configure domains for external images if needed
    domains: [],
    // Configure image formats for better compression
    formats: ['image/webp', 'image/avif'],
    // Configure image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['react-hot-toast'],
  },
};

export default nextConfig;
