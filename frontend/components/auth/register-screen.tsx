"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import SplashCursor from "./SplashCursor";

const BACK_ICON_URL = "https://www.figma.com/api/mcp/asset/7cba2bf9-5cec-43b5-8f60-d936e3627abc";
const EMAIL_ICON_URL = "https://www.figma.com/api/mcp/asset/73175457-707c-49df-bcda-5fd0f9909e61";
const LOCK_ICON_URL = "https://www.figma.com/api/mcp/asset/baf29dbe-38cb-4314-ae54-9b78b49b0521";
const REGISTER_ENDPOINT = "/api/auth/register";
const VERIFY_OTP_ENDPOINT = "/api/auth/verify-email-otp";
const RESEND_OTP_ENDPOINT = "/api/auth/resend-email-otp";

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
};

type RegisterResponse = {
  message: string;
  email: string;
  requiresEmailVerification: boolean;
};

type ErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

type MessageResponse = {
  message: string;
};

type InputFieldProps = {
  label: string;
  placeholder: string;
  type: "text" | "password" | "email";
  iconUrl?: string;
  rightSlot?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
};

function InputField({
  label,
  placeholder,
  type,
  iconUrl,
  rightSlot,
  value,
  onChange,
}: InputFieldProps) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[1px] text-white/65">{label}</span>
      <span className="relative block h-10">
        {iconUrl ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 block size-4 -translate-y-1/2 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${iconUrl})` }}
          />
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 block -translate-y-1/2 text-sm text-white/40"
          >
            👤
          </span>
        )}
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

export default function RegisterScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const queryEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
    if (mode !== "verify" || !queryEmail) return;

    setStep("verify");
    setVerificationEmail(queryEmail);
    setEmail(queryEmail);
    setInfo("Please enter OTP sent to your email.");
    setError(null);
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const payload: RegisterPayload = { email, password, name };
    setLoading(true);
    try {
      const response = await fetch(REGISTER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as RegisterResponse | ErrorResponse;

      if (!response.ok) {
        if ("errors" in data && data.errors) {
          throw new Error(Object.values(data.errors).join(" "));
        }
        throw new Error((data as ErrorResponse).message ?? "Register failed. Please check your information.");
      }

      if (!("requiresEmailVerification" in data)) {
        throw new Error("Invalid response from server.");
      }

      setVerificationEmail(data.email);
      setOtp("");
      setName("");
      setEmail("");
      setPassword("");
      setStep("verify");
      setInfo(data.message ?? "OTP has been sent to your email.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "An error occurred while registering.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const response = await fetch(VERIFY_OTP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: verificationEmail, otp }),
      });

      const data = (await response.json().catch(() => ({}))) as MessageResponse | ErrorResponse;

      if (!response.ok) {
        if ("errors" in data && data.errors) {
          throw new Error(Object.values(data.errors).join(" "));
        }
        throw new Error((data as ErrorResponse).message ?? "OTP verification failed.");
      }

      setInfo((data as MessageResponse).message ?? "Email verified successfully.");
      setTimeout(() => router.push(`/login?email=${encodeURIComponent(verificationEmail)}`), 700);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "An error occurred while verifying OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verificationEmail) return;

    setError(null);
    setInfo(null);
    setResendLoading(true);

    try {
      const response = await fetch(RESEND_OTP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data = (await response.json().catch(() => ({}))) as MessageResponse | ErrorResponse;
      if (!response.ok) {
        if ("errors" in data && data.errors) {
          throw new Error(Object.values(data.errors).join(" "));
        }
        throw new Error((data as ErrorResponse).message ?? "Failed to resend OTP.");
      }

      setInfo((data as MessageResponse).message ?? "A new OTP has been sent to your email.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "An error occurred while resending OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <SplashCursor />

      <Link
        href="/login"
        className="absolute left-8 top-8 z-20 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.7px] text-white/70 transition hover:text-white"
      >
        <span
          aria-hidden
          className="block size-5 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACK_ICON_URL})` }}
        />
        Back to Login
      </Link>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1144px] flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-[400px]">
          <article className="rounded-md border border-white/10 bg-black/40 px-5 py-5 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
            <header className="mb-6 text-center">
              <h1 className="text-3xl font-light uppercase tracking-[6px]">
                {step === "register" ? "SIGN UP" : "VERIFY EMAIL"}
              </h1>
              <div className="mx-auto mt-4 h-px w-12 bg-linear-to-r from-transparent via-white/50 to-transparent" />
            </header>

            {step === "register" ? (
              <form className="space-y-3.5" onSubmit={handleSubmit}>
                <InputField
                  label="Name"
                  placeholder="Enter your name"
                  type="text"
                  value={name}
                  onChange={setName}
                />

                <InputField
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
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

                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                {info ? <p className="text-sm text-emerald-300">{info}</p> : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full rounded-md bg-white text-[12px] font-medium uppercase tracking-[1.8px] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/60"
                >
                  {loading ? "Registering..." : "Register"}
                </button>

                <p className="pt-1 text-center text-xs text-white/50">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-sm font-medium uppercase tracking-[0.8px] text-white underline decoration-solid underline-offset-2"
                  >
                    Log In
                  </Link>
                </p>
              </form>
            ) : (
              <form className="space-y-3.5" onSubmit={handleVerifyOtp}>
                <p className="text-sm text-white/70">
                  Enter the 6-digit OTP sent to <span className="font-medium text-white">{verificationEmail}</span>
                </p>

                <InputField
                  label="OTP"
                  placeholder="Enter 6-digit OTP"
                  type="text"
                  value={otp}
                  onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
                />

                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                {info ? <p className="text-sm text-emerald-300">{info}</p> : null}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="h-10 w-full rounded-md bg-white text-[12px] font-medium uppercase tracking-[1.8px] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/60"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="h-10 w-full rounded-md border border-white/20 bg-transparent text-[12px] font-medium uppercase tracking-[1.8px] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>

                <p className="pt-1 text-center text-xs text-white/50">
                  Wrong email?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("register");
                      setError(null);
                      setInfo(null);
                      setOtp("");
                    }}
                    className="text-sm font-medium uppercase tracking-[0.8px] text-white underline decoration-solid underline-offset-2"
                  >
                    Back
                  </button>
                </p>
              </form>
            )}
          </article>

          {/* <p className="pt-8 text-center text-xs uppercase tracking-[2.4px] text-white/30">Luxury Fashion Collective</p> */}
        </div>
      </section>
    </main>
  );
}
