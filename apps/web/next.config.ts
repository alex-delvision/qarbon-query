import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    // Disable image optimization for static export
    unoptimized: true,
    // Configure domains for external images if needed
    domains: [],
  },
  // Configure for custom domain
  assetPrefix:
    process.env.NODE_ENV === 'production' ? 'https://qarbonquery.ai' : '',
  basePath: '',
  env: {
    SITE_URL: 'https://qarbonquery.ai',
    NEXT_PUBLIC_SITE_URL: 'https://qarbonquery.ai',
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['react-hot-toast'],
  },
};

export default nextConfig;
