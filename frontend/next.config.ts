import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendDir, "..");

loadEnvConfig(repoRoot);

// Auth-service base URL (Spring Boot service on :8081 by default).
// Requests to /api/auth/* are proxied here, so the browser stays same-origin (no CORS).
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? "http://localhost:8081";
const API_GATEWAY_URL =
  process.env.BACKEND_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${AUTH_SERVICE_URL}/api/auth/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${API_GATEWAY_URL}/api/users/:path*`,
      },
    ];
  },
};

export default nextConfig;
