"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { AuthError } from "../lib/auth";

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M8.5 2.5L4 7l4.5 4.5"
        stroke="#444748"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2.03H10v3.85h5.4a4.6 4.6 0 01-2 3.02v2.5h3.23c1.89-1.74 2.97-4.3 2.97-7.34z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.23-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.81-1.76-5.6-4.13H1.07v2.59A10 10 0 0010 20z"
        fill="#34A853"
      />
      <path
        d="M4.4 11.9a6 6 0 010-3.8V5.51H1.07a10 10 0 000 8.98L4.4 11.9z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.96c1.47 0 2.79.51 3.82 1.5l2.86-2.86A10 10 0 001.07 5.51L4.4 8.1C5.19 5.73 7.4 3.96 10 3.96z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M20 10a10 10 0 10-11.56 9.88v-6.99H5.9V10h2.54V7.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V10h2.78l-.44 2.89h-2.34v6.99A10 10 0 0020 10z"
        fill="#1877F2"
      />
      <path
        d="M13.89 12.89L14.33 10h-2.78V8.13c0-.79.39-1.56 1.63-1.56h1.26V4.11s-1.15-.2-2.24-.2c-2.29 0-3.78 1.39-3.78 3.89V10H5.9v2.89h2.54v6.99a10.07 10.07 0 003.12 0v-6.99h2.34z"
        fill="#fff"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/account");
    } catch (err) {
      if (err instanceof AuthError && err.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Unable to sign in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-6 py-16">
      <div className="flex w-full max-w-[440px] flex-col gap-8">
        {/* Brand & back link */}
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted transition-colors hover:text-text-main"
          >
            <ArrowLeftIcon />
            Back to Home
          </Link>
          <span className="font-jakarta text-[32px] font-semibold tracking-[-1.6px] text-[#5d5f5f]">
            LUA LA
          </span>
        </div>

        {/* Headings */}
        <div className="flex flex-col gap-[7px]">
          <h1 className="font-jakarta text-[24px] font-semibold leading-[1.3] text-text-main">
            Welcome Back
          </h1>
          <p className="text-[16px] leading-[1.6] text-text-muted">
            Sign in to continue shopping your favorite styles.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-[#f0c0c0] bg-[#fbeaea] px-4 py-3 text-[14px] text-[#a13a3a]"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-[16px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-[16px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-text-muted">
              <input
                type="checkbox"
                name="remember"
                className="size-4 rounded border-[#747878] bg-neutral-bg accent-accent"
              />
              Remember me
            </label>
            <Link
              href="#"
              className="text-[14px] text-accent transition-colors hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign in */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-4 text-[14px] font-medium uppercase tracking-[0.7px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-[rgba(196,199,200,0.5)]" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted">
            Or continue with
          </span>
          <span className="h-px flex-1 bg-[rgba(196,199,200,0.5)]" />
        </div>

        {/* Social logins */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="flex items-center justify-center gap-3 rounded-lg border border-border-soft bg-primary py-3 text-[14px] font-medium tracking-[0.14px] text-text-main transition-colors hover:bg-neutral-bg"
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-3 rounded-lg border border-border-soft bg-primary py-3 text-[14px] font-medium tracking-[0.14px] text-text-main transition-colors hover:bg-neutral-bg"
          >
            <FacebookIcon />
            Facebook
          </button>
        </div>

        {/* Footer link */}
        <p className="pt-[15px] text-center text-[16px] text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
