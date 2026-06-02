import { NextRequest } from "next/server";
import Redis from "ioredis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  if (!paymentId) {
    return Response.json({ error: "Missing paymentId" }, { status: 400 });
  }

  // 1. Check current status from payment-service first
  const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL ?? "http://localhost:8085";
  try {
    const checkRes = await fetch(`${paymentServiceUrl}/payments/${paymentId}`, {
      cache: "no-store",
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        return Response.json({ status: data.status });
      }
    }
  } catch (err) {
    console.error("Error checking payment status: ", err);
  }

  // 2. Setup Redis subscriber for long-polling
  const redisHost = process.env.REDIS_HOST ?? "localhost";
  const redisPort = Number(process.env.REDIS_PORT ?? "6379");
  const redisPassword = process.env.REDIS_PASSWORD ?? undefined;
  const redisUsername = process.env.REDIS_USERNAME ?? undefined;

  const subscriber = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    username: redisUsername,
    maxRetriesPerRequest: null,
  });

  const channel = `payment:status:${paymentId}`;
  let isResolved = false;

  // We will return a Promise that resolves when:
  // - Pub/Sub receives "COMPLETED" or "FAILED"
  // - Timeout (8s for Hobby plan) is reached
  // - Request is aborted/cancelled by the user
  const resultPromise = new Promise<{ status: string }>((resolve) => {
    const cleanup = () => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timeoutId);
      subscriber.unsubscribe(channel).catch(() => {});
      subscriber.quit().catch(() => {});
    };

    // Timeout (8 seconds for Hobby plan)
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({ status: "PENDING" });
    }, 8000);

    // Pub/Sub listener
    subscriber.on("message", (chan, message) => {
      if (chan === channel) {
        if (message === "COMPLETED" || message === "FAILED") {
          cleanup();
          resolve({ status: message });
        }
      }
    });

    // Handle connection errors
    subscriber.on("error", (err) => {
      console.error("Redis subscriber error:", err);
      cleanup();
      resolve({ status: "PENDING" }); // fallback to client retry
    });

    // Subscribe
    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error("Redis subscribe failed:", err);
        cleanup();
        resolve({ status: "PENDING" });
      }
    });

    // Handle request abortion (user navigates away / closes tab / browser stops request)
    request.signal.addEventListener("abort", () => {
      cleanup();
      resolve({ status: "PENDING" });
    });
  });

  try {
    const result = await resultPromise;
    return Response.json(result);
  } catch (error) {
    console.error("Error in wait route:", error);
    return Response.json({ status: "PENDING" });
  }
}
