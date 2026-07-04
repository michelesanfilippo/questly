import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    // Future: add remote patterns for CDN artwork
    // remotePatterns: [],
  },
};

export default nextConfig;
