import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

type AuthResponse = {
  accessToken: string;
  tokenType: string;
  userId: number;
  email: string;
  name: string;
  role: string;
};

type ErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = (await backendResponse.json().catch(() => ({}))) as AuthResponse | ErrorResponse;
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to authentication service." },
      { status: 500 },
    );
  }
}
