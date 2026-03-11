import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 'localhost'
      },
      {
        hostname: 'cdn.emilydelacruz.com',
        pathname: '/images/**',
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