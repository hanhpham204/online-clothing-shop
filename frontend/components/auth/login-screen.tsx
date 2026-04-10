"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import SplashCursor from "./SplashCursor";

const EMAIL_ICON_URL = "https://www.figma.com/api/mcp/asset/73175457-707c-49df-bcda-5fd0f9909e61";
const LOCK_ICON_URL = "https://www.figma.com/api/mcp/asset/baf29dbe-38cb-4314-ae54-9b78b49b0521";
const GOOGLE_ICON_URL = "https://www.figma.com/api/mcp/asset/9fab0d51-2f3f-4023-a402-12b4a7ea4848";
const BACK_ICON_URL = "https://www.figma.com/api/mcp/asset/7cba2bf9-5cec-43b5-8f60-d936e3627abc";
const LOGIN_ENDPOINT = "/api/auth/login";

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

function InputField({ label, placeholder, type, iconUrl, rightSlot, value, onChange }: InputFieldProps) {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-[1.2px] text-white/70">{label}</span>
      <span className="relative block h-12">
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 block size-5 -translate-y-1/2 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${iconUrl})` }}
        />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full rounded-lg border border-white/10 bg-white/5 pl-12 pr-12 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/30"
        />
        {rightSlot ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">{rightSlot}</span>
        ) : null}
      </span>
    </label>
  );
}

type SocialButtonProps = {
  text: string;
  iconUrl: string;
};

function SocialButton({ text, iconUrl }: SocialButtonProps) {
  return (
    <button
      type="button"
      className="flex h-[53.6px] w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-white/5 text-sm font-medium uppercase tracking-[0.7px] text-white transition hover:bg-white/10"
    >
      <span
        aria-hidden
        className="block size-5 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${iconUrl})` }}
      />
      {text}
    </button>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.message ?? "Login failed. Please check your credentials.");
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

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1144px] flex-col items-center justify-center px-4 py-2">
        <div className="w-full max-w-[448px]">
          <article className="rounded-md border border-white/10 bg-black/40 px-5 py-3 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
            <header className="mb-12 text-center">
              <h1 className="text-4xl font-light uppercase tracking-[7.2px]">WELCOME BACK</h1>
              <div className="mx-auto mt-7 h-px w-16 bg-linear-to-r from-transparent via-white/50 to-transparent" />
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  className="text-xs font-medium uppercase tracking-[0.6px] text-white/50 transition hover:text-white"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-lg bg-white text-sm font-medium uppercase tracking-[2.1px] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/60"
              >
                {loading ? "Logging In..." : "Log In"}
              </button>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <div className="relative ">
                <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/10" />
                <span className="relative mx-auto block w-fit bg-black/40 px-4 text-xs uppercase tracking-[0.6px] text-white/50">
                  Or continue with
                </span>
              </div>

              <div className="space-y-3">
                <SocialButton text="Sign in with Google" iconUrl={GOOGLE_ICON_URL} />
              </div>

              <p className="pt-4 text-center text-sm text-white/50">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-base font-medium uppercase tracking-[0.8px] text-white underline decoration-solid underline-offset-2"
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
