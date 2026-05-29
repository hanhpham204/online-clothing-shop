import type { NextConfig } from "next";

// Auth-service base URL (Spring Boot service on :8081 by default).
// Requests to /api/auth/* are proxied here, so the browser stays same-origin (no CORS).
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? "http://localhost:8081";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${AUTH_SERVICE_URL}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
