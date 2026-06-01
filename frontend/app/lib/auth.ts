// Auth API client for the Spring Boot auth-service.
// Calls go through the Next.js rewrite proxy at /api/auth/* (see next.config.ts),
// so the browser request is same-origin and avoids CORS.

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
};

// We don't return accessToken/refreshToken anymore since they are HttpOnly cookies
export type AuthResponse = {
  message: string;
};

export type RegisterResponse = {
  message: string;
  email: string;
  requiresEmailVerification: boolean;
};

export type MessageResponse = { message: string };

export class AuthError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

const BASE = "/api/auth";

async function post<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new AuthError(
      "Cannot reach the server. Please make sure the auth service is running.",
      0,
      "NETWORK_ERROR"
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (json && (json.message as string)) ||
      "Something went wrong. Please try again.";
    throw new AuthError(message, res.status, json?.code);
  }

  return (json?.data ?? json) as T;
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch {
    throw new AuthError(
      "Cannot reach the server.",
      0,
      "NETWORK_ERROR"
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (json && (json.message as string)) ||
      "Something went wrong. Please try again.";
    throw new AuthError(message, res.status, json?.code);
  }

  return (json?.data ?? json) as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    post<AuthResponse>("/login", { email, password }),

  register: (email: string, password: string, fullName: string) =>
    post<RegisterResponse>("/register", { email, password, fullName }),

  verifyEmailOtp: (email: string, otp: string) =>
    post<MessageResponse>("/verify-email-otp", { email, otp }),

  resendEmailOtp: (email: string) =>
    post<MessageResponse>("/resend-email-otp", { email }),

  google: (idToken: string) =>
    post<AuthResponse>("/google", { idToken }),

  logout: () =>
    post<MessageResponse>("/logout"),

  me: () =>
    get<{ user: AuthUser }>("/me"),

  updateProfile: (profileData: { fullName?: string; phone?: string; address?: string; gender?: string }) =>
    post<{ user: AuthUser; message: string }>("/profile/update", profileData),
};
