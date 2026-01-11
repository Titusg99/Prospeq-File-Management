import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Mark better-sqlite3 as external - it's a native module that webpack shouldn't bundle
  serverComponentsExternalPackages: ['better-sqlite3'],
  experimental: {
    // Ensure native modules work properly
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;

