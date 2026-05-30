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
  AuthError,
  authApi,
  type AuthResponse,
  type AuthUser,
  type RegisterResponse,
} from "../lib/auth";
import { userApi, type UserProfile } from "../lib/user";

const STORAGE_KEY = "luala.auth";

export type CurrentUser = AuthUser & {
  fullName: string;
  phone: string | null;
  address: string | null;
};

type StoredAuth = {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
};

type AuthContextValue = {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  userLoading: boolean;
  userError: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (firebaseIdToken: string) => Promise<AuthResponse>;
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

function mergeAuthUser(data: AuthResponse, profile?: UserProfile): CurrentUser {
  return {
    userId: data.userId,
    email: data.email,
    name: profile?.fullName || data.name,
    fullName: profile?.fullName || data.name,
    phone: profile?.phone ?? null,
    address: profile?.address ?? null,
    role: profile?.role || data.role,
  };
}

function mergeStoredUser(user: CurrentUser, profile: UserProfile): CurrentUser {
  return {
    ...user,
    name: profile.fullName || user.name,
    fullName: profile.fullName || user.fullName || user.name,
    phone: profile.phone ?? null,
    address: profile.address ?? null,
    role: profile.role || user.role,
  };
}

async function refreshStoredSession(stored: StoredAuth): Promise<StoredAuth> {
  const refreshed = await authApi.refresh(stored.refreshToken);
  return {
    user: mergeAuthUser(refreshed),
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
  };
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function hydrateUser() {
      const stored = readStored();
      if (!stored?.user || !stored.accessToken) {
        if (active) setLoading(false);
        return;
      }

      if (active) {
        setUser(stored.user);
        setUserLoading(true);
        setUserError(null);
      }

      try {
        let session = stored;
        let profile: UserProfile;
        try {
          profile = await userApi.getProfile(
            session.user.userId,
            session.accessToken
          );
        } catch (err) {
          if (!(err instanceof AuthError) || err.status !== 401) {
            throw err;
          }
          session = await refreshStoredSession(session);
          profile = await userApi.getProfile(
            session.user.userId,
            session.accessToken
          );
        }
        if (!active) return;
        const nextUser = mergeStoredUser(session.user, profile);
        const payload: StoredAuth = { ...session, user: nextUser };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setUser(nextUser);
      } catch (err) {
        if (!active) return;
        if (err instanceof AuthError && err.status === 401) {
          window.localStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
        setUserError(
          err instanceof Error ? err.message : "Unable to load user profile."
        );
      } finally {
        if (active) {
          setUserLoading(false);
          setLoading(false);
        }
      }
    }

    hydrateUser();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (data: AuthResponse) => {
    setUserLoading(true);
    setUserError(null);
    try {
      const profile = await userApi.getProfile(data.userId, data.accessToken);
      const nextUser = mergeAuthUser(data, profile);
      const payload: StoredAuth = {
        user: nextUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setUser(nextUser);
    } catch (err) {
      const nextUser = mergeAuthUser(data);
      const payload: StoredAuth = {
        user: nextUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setUser(nextUser);
      setUserError(
        err instanceof Error ? err.message : "Unable to load user profile."
      );
    } finally {
      setUserLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      await persist(data);
      return data;
    },
    [persist]
  );

  const loginWithGoogle = useCallback(
    async (firebaseIdToken: string) => {
      const data = await authApi.google(firebaseIdToken);
      await persist(data);
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
    setUserError(null);
  }, []);

  const getAccessToken = useCallback(() => readStored()?.accessToken ?? null, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      userLoading,
      userError,
      login,
      loginWithGoogle,
      register,
      verifyOtp,
      resendOtp,
      logout,
      getAccessToken,
    }),
    [
      user,
      loading,
      userLoading,
      userError,
      login,
      loginWithGoogle,
      register,
      verifyOtp,
      resendOtp,
      logout,
      getAccessToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
