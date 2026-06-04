"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, use } from "react";
import { useAuth } from "../components/AuthProvider";
import { AuthError } from "../lib/auth";
import { getGoogleFirebaseIdToken } from "../lib/firebase";
import { toast } from "sonner";

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
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
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

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const initialEmail = resolvedParams.email || "";
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back! Signed in successfully.");
      router.push("/account");
    } catch (err) {
      if (err instanceof AuthError && err.code === "EMAIL_NOT_VERIFIED") {
        toast.warning("Email not verified yet. Redirecting to verification...");
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      const msg = err instanceof Error ? err.message : "Unable to sign in. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleSubmitting(true);
    try {
      const firebaseIdToken = await getGoogleFirebaseIdToken();
      await loginWithGoogle(firebaseIdToken);
      toast.success("Signed in with Google successfully!");
      router.push("/account");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to sign in with Google. Please try again.";
      toast.error(msg);
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    // h-dvh + overflow-hidden = no page scroll. The inner card uses
    // max-h-full + overflow-y-auto as a safety net for ultra-short viewports
    // (e.g. tiny mobile windows), but on any normal screen everything fits.
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-primary px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex max-h-full w-full max-w-[420px] flex-col gap-6 overflow-y-auto py-2">
        {/* Brand on top, back link directly underneath */}
        <div className="flex flex-col gap-2.5">
          <span className="font-jakarta text-[26px] font-semibold leading-none tracking-[-1.3px] text-[#5d5f5f]">
            LUA LA
          </span>
          <Link
            href="/"
            className="flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted transition-colors hover:text-text-main"
          >
            <ArrowLeftIcon />
            Back to Home
          </Link>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="font-jakarta text-[24px] font-semibold leading-tight text-text-main">
            Welcome Back
          </h1>
          <p className="text-[15px] leading-relaxed text-text-muted">
            Sign in to continue shopping your favorite styles.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3.5">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3 text-[15px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
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
              className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3 text-[15px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-muted">
              <input
                type="checkbox"
                name="remember"
                className="size-4 rounded border-[#747878] bg-neutral-bg accent-accent"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] text-accent transition-colors hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting || googleSubmitting}
            className="mt-1 w-full rounded-lg bg-accent py-3.5 text-[13px] font-medium uppercase tracking-[0.7px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[rgba(196,199,200,0.5)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-text-muted">
            Or continue with
          </span>
          <span className="h-px flex-1 bg-[rgba(196,199,200,0.5)]" />
        </div>

        {/* Social logins */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting || googleSubmitting}
          className="flex items-center justify-center gap-2.5 rounded-lg border border-border-soft bg-primary py-3 text-[14px] font-medium tracking-[0.14px] text-text-main transition-colors hover:bg-neutral-bg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {googleSubmitting ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Footer link */}
        <p className="text-center text-[14px] text-text-muted">
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
