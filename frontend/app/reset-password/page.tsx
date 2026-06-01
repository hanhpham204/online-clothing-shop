"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, use, useEffect } from "react";
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

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const initialEmail = resolvedParams.email || "";
  
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Bộ đếm ngược cooldown 30s
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResendOtp() {
    if (!email) {
      toast.error("Email address is required to resend OTP.");
      return;
    }
    if (resendCooldown > 0) return;

    setResending(true);
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
        throw new Error(resData.message || "Failed to resend OTP.");
      }

      toast.success(resData.message || "A new OTP code has been sent to your email!");
      setResendCooldown(30); // Khóa nút trong 30s
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email) {
      toast.error("Email address is required.");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }
    if (password.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          password,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to reset password.");
      }

      toast.success("Password reset successfully! You can now sign in.");
      router.push(`/login?email=${encodeURIComponent(email)}&reset=1`);
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
            href="/forgot-password"
            className="flex w-fit items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted transition-colors hover:text-text-main"
          >
            <ArrowLeftIcon />
            Back to Forgot Password
          </Link>
          <span className="font-jakarta text-[32px] font-semibold tracking-[-1.6px] text-[#5d5f5f]">
            LUA LA
          </span>
        </div>

        {/* Headings */}
        <div className="flex flex-col gap-[7px]">
          <h1 className="font-jakarta text-[24px] font-semibold leading-[1.3] text-text-main">
            Reset Password
          </h1>
          <p className="text-[16px] leading-[1.6] text-text-muted">
            Enter the 6-digit OTP code sent to your email and choose a new password.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {/* Email input */}
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

            {/* OTP input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp" className="sr-only">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                placeholder="6-Digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-center text-[20px] tracking-[0.4em] text-text-main placeholder:tracking-normal placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="New Password (at least 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-[16px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Confirm Password input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-[16px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-4 text-[14px] font-medium uppercase tracking-[0.7px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Resetting password…" : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-[16px] text-text-muted">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending || resendCooldown > 0}
            className="font-semibold text-accent transition-colors hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending
              ? "Sending…"
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend OTP"}
          </button>
        </p>
      </div>
    </div>
  );
}
