"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to request password reset.");
      }

      toast.success(resData.message || "OTP code sent to your email!");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
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
            href="/login"
            className="flex w-fit items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted transition-colors hover:text-text-main"
          >
            <ArrowLeftIcon />
            Back to Sign In
          </Link>
          <span className="font-jakarta text-[32px] font-semibold tracking-[-1.6px] text-[#5d5f5f]">
            LUA LA
          </span>
        </div>

        {/* Headings */}
        <div className="flex flex-col gap-[7px]">
          <h1 className="font-jakarta text-[24px] font-semibold leading-[1.3] text-text-main">
            Forgot Password
          </h1>
          <p className="text-[16px] leading-[1.6] text-text-muted">
            Enter your email address and we&apos;ll send you a 6-digit OTP code to reset your password.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
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
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-[16px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-4 text-[14px] font-medium uppercase tracking-[0.7px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending OTP…" : "Send Reset Code"}
          </button>
        </form>
      </div>
    </div>
  );
}
