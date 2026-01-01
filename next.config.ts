import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'localhost'
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/records/feed.xml',
        destination: '/records/feed',
      },
    ];
  },
};

export default nextConfig;