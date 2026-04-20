"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import SplashCursor from "./SplashCursor";
import { GoogleLogin } from "@react-oauth/google";

const EMAIL_ICON_URL = "https://www.figma.com/api/mcp/asset/73175457-707c-49df-bcda-5fd0f9909e61";
const LOCK_ICON_URL = "https://www.figma.com/api/mcp/asset/baf29dbe-38cb-4314-ae54-9b78b49b0521";
const BACK_ICON_URL = "https://www.figma.com/api/mcp/asset/7cba2bf9-5cec-43b5-8f60-d936e3627abc";
const LOGIN_ENDPOINT = "/api/auth/login";
const GOOGLE_LOGIN_ENDPOINT = "/api/auth/google";

type LoginPayload = {
  email: string;
  password: string;
};

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

type InputFieldProps = {
  label: string;
  placeholder: string;
  type: "text" | "password";
  iconUrl: string;
  rightSlot?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
};

type GoogleLoginButtonProps = {
  onSuccess: (data: AuthResponse) => void;
  onError: (message: string) => void;
};

function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  return (
    <GoogleLogin
      onSuccess={async (cred) => {
        if (!cred.credential) {
          onError("Google credential is missing.");
          return;
        }

        try {
          const response = await fetch(GOOGLE_LOGIN_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: cred.credential }),
          });
          const data = (await response.json().catch(() => ({}))) as AuthResponse | ErrorResponse;

          if (!response.ok) {
            if ("errors" in data && data.errors) {
              throw new Error(Object.values(data.errors).join(" "));
            }
            throw new Error((data as ErrorResponse).message ?? "Google login failed.");
          }

          if (!("accessToken" in data)) {
            throw new Error("Invalid response from server.");
          }

          onSuccess(data);
        } catch (error) {
          onError(error instanceof Error ? error.message : "Unable to connect to authentication service.");
        }
      }}
      onError={() => onError("Google login failed. Please try again.")}
    />
  );
}

function InputField({ label, placeholder, type, iconUrl, rightSlot, value, onChange }: InputFieldProps) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[1px] text-white/65">{label}</span>
      <span className="relative block h-10">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 block size-4 -translate-y-1/2 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${iconUrl})` }}
        />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-10 text-[13px] text-white placeholder:text-white/30 outline-none transition focus:border-white/30"
        />
        {rightSlot ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">{rightSlot}</span>
        ) : null}
      </span>
    </label>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedEmail = email.trim().toLowerCase();
  const isEmailUnverifiedError =
    typeof error === "string" && error.toLowerCase().includes("email is not verified");

  useEffect(() => {
    const prefillEmail = searchParams.get("email")?.trim().toLowerCase();
    if (!prefillEmail) return;
    setEmail(prefillEmail);
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const payload: LoginPayload = { email, password };
    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as AuthResponse | ErrorResponse;

      if (!response.ok) {
        if ("errors" in data && data.errors) {
          throw new Error(Object.values(data.errors).join(" "));
        }
        throw new Error((data as ErrorResponse).message ?? "Login failed. Please check your credentials.");
      }

      if (!("accessToken" in data)) {
        throw new Error("Invalid response from server.");
      }

      localStorage.setItem("authToken", data.accessToken);
      localStorage.setItem("authTokenType", data.tokenType);
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          id: data.userId,
          email: data.email,
          name: data.name,
          role: data.role,
        }),
      );

      router.push("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "An error occurred while logging in.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (data: AuthResponse) => {
    localStorage.setItem("authToken", data.accessToken);
    localStorage.setItem("authTokenType", data.tokenType);
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
      }),
    );

    router.push("/");
  };

  const handleGoToVerifyOtp = () => {
    if (!normalizedEmail) return;
    router.push(`/register?mode=verify&email=${encodeURIComponent(normalizedEmail)}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <SplashCursor />

      <Link
        href="/"
        className="absolute left-8 top-8 z-20 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.7px] text-white/70 transition hover:text-white"
      >
        <span
          aria-hidden
          className="block size-5 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACK_ICON_URL})` }}
        />
        Back to Home
      </Link>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1144px] flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-[400px]">
          <article className="rounded-md border border-white/10 bg-black/40 px-5 py-5 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
            <header className="mb-6 text-center">
              <h1 className="text-3xl font-light uppercase tracking-[6px]">WELCOME BACK</h1>
              <div className="mx-auto mt-4 h-px w-12 bg-linear-to-r from-transparent via-white/50 to-transparent" />
            </header>

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <InputField
                label="Email / Username"
                placeholder="Enter your email"
                type="text"
                iconUrl={EMAIL_ICON_URL}
                value={email}
                onChange={setEmail}
              />

              <InputField
                label="Password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                iconUrl={LOCK_ICON_URL}
                value={password}
                onChange={setPassword}
                rightSlot={
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="cursor-pointer text-lg leading-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>
                }
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[11px] font-medium uppercase tracking-[0.6px] text-white/50 transition hover:text-white"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-md bg-white text-[12px] font-medium uppercase tracking-[1.8px] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/60"
              >
                {loading ? "Logging In..." : "Log In"}
              </button>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              {isEmailUnverifiedError ? (
                <button
                  type="button"
                  onClick={handleGoToVerifyOtp}
                  disabled={!normalizedEmail}
                  className="h-10 w-full rounded-md border border-white/20 bg-transparent text-[12px] font-medium uppercase tracking-[1.8px] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Verify Email With OTP
                </button>
              ) : null}

              <div className="relative ">
                <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/10" />
                <span className="relative mx-auto block w-fit bg-black/40 px-4 text-xs uppercase tracking-[0.6px] text-white/50">
                  Or continue with
                </span>
              </div>

              <GoogleLoginButton onSuccess={handleAuthSuccess} onError={setError} />

              <p className="pt-1 text-center text-xs text-white/50">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-sm font-medium uppercase tracking-[0.8px] text-white underline decoration-solid underline-offset-2"
                >
                  Sign Up
                </Link>
              </p>
            </form>
          </article>

          {/* <p className="pt-8 text-center text-xs uppercase tracking-[2.4px] text-white/30">Luxury Fashion Collective</p> */}
        </div>
      </section>
    </main>
  );
}
