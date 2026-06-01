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
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL ?? "http://localhost:8083";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:8084";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL ?? "http://localhost:8085";
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL ?? "http://localhost:8088";

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
    NEXT_PUBLIC_BANK_ID:
      process.env.NEXT_PUBLIC_BANK_ID ?? "",
    NEXT_PUBLIC_BANK_ACCOUNT:
      process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "",
    NEXT_PUBLIC_BANK_ACCOUNT_NAME:
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "",
    NEXT_PUBLIC_IS_VA:
      process.env.NEXT_PUBLIC_IS_VA ?? "true",
  },
  async rewrites() {
    return [
      {
        source: "/api/chatbot/:path*",
        destination: `${CHATBOT_SERVICE_URL}/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${AUTH_SERVICE_URL}/api/auth/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${API_GATEWAY_URL}/api/users/:path*`,
      },
      {
        source: "/api/products/:path*",
        destination: `${PRODUCT_SERVICE_URL}/products/:path*`,
      },
      {
        source: "/api/orders/:path*",
        destination: `${ORDER_SERVICE_URL}/orders/:path*`,
      },
      {
        source: "/api/payments/:path*",
        destination: `${PAYMENT_SERVICE_URL}/payments/:path*`,
      },
      {
        source: "/api/v1/payments/:path*",
        destination: `${PAYMENT_SERVICE_URL}/api/v1/payments/:path*`,
      },
      {
        source: "/payments/:path*",
        destination: `${PAYMENT_SERVICE_URL}/payments/:path*`,
      },
    ];
  },
};

export default nextConfig;
