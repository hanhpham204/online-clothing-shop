"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
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

export default function VerifyEmailForm({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const router = useRouter();
  const { verifyOtp, resendOtp } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyOtp(email, otp);
      toast.success("Email verified successfully! You can now sign in.");
      router.push(`/login?email=${encodeURIComponent(email)}&verified=1`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      await resendOtp(email);
      const msg = "A new verification code has been sent to your email.";
      toast.success(msg);
      setResendCooldown(30); // thiết lập cooldown 30 giây
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not resend the code. Please try again.";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-6 py-16">
      <div className="flex w-full max-w-[440px] flex-col gap-8">
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

        <div className="flex flex-col gap-[7px]">
          <h1 className="font-jakarta text-[24px] font-semibold leading-[1.3] text-text-main">
            Verify Your Email
          </h1>
          <p className="text-[16px] leading-[1.6] text-text-muted">
            We sent a 6-digit code to your inbox. Enter it below to activate your
            account.
          </p>
        </div>

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
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-[16px] text-text-main placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp" className="sr-only">
                Verification code
              </label>
              <input
                id="otp"
                name="otp"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full rounded-lg border border-border-soft bg-neutral-bg px-4 py-3.5 text-center text-[20px] tracking-[0.4em] text-text-main placeholder:tracking-normal placeholder:text-[rgba(68,71,72,0.6)] focus:border-accent focus:bg-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-4 text-[14px] font-medium uppercase tracking-[0.7px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <p className="text-center text-[16px] text-text-muted">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="font-semibold text-accent transition-colors hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending
              ? "Sending…"
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </p>
      </div>
    </div>
  );
}
