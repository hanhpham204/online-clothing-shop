import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'backend' },
      { protocol: 'https', hostname: 'qr.sepay.vn' },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
