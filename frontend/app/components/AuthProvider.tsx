"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  type AuthResponse,
  type AuthUser,
  type RegisterResponse,
} from "../lib/auth";

const STORAGE_KEY = "luala.auth";

type StoredAuth = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<RegisterResponse>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (stored?.user) setUser(stored.user);
    setLoading(false);
  }, []);

  const persist = useCallback((data: AuthResponse) => {
    const nextUser: AuthUser = {
      userId: data.userId,
      email: data.email,
      name: data.name,
      role: data.role,
    };
    const payload: StoredAuth = {
      user: nextUser,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      persist(data);
      return data;
    },
    [persist]
  );

  const register = useCallback(
    (email: string, password: string, fullName: string) =>
      authApi.register(email, password, fullName),
    []
  );

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await authApi.verifyEmailOtp(email, otp);
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await authApi.resendEmailOtp(email);
  }, []);

  const logout = useCallback(async () => {
    const stored = readStored();
    if (stored?.refreshToken) {
      try {
        await authApi.logout(stored.refreshToken);
      } catch {
        // Logout is best-effort; clear local session regardless.
      }
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const getAccessToken = useCallback(() => readStored()?.accessToken ?? null, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      getAccessToken,
    }),
    [user, loading, login, register, verifyOtp, resendOtp, logout, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
