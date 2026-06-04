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
// No longer importing userApi because user profiles are unified under auth-service.

export type CurrentUser = AuthUser & {
  fullName: string;
  phone: string | null;
  address: string | null;
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
  updateProfile: (profileData: { fullName?: string; phone?: string; address?: string; gender?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mergeAuthUser(data: AuthUser): CurrentUser {
  return {
    userId: data.userId,
    email: data.email,
    name: data.name,
    fullName: data.name,
    phone: data.phone ?? null,
    address: data.address ?? null,
    role: data.role || "USER",
    gender: data.gender ?? null,
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

  const loadUser = useCallback(async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const { user: authUser } = await authApi.me();
      if (authUser) {
        setUser(mergeAuthUser(authUser));
      }
    } catch (err) {
      setUser(null);
      if (err instanceof AuthError && err.status === 401) {
        // Not authenticated
      } else {
        setUserError(
          err instanceof Error ? err.message : "Unable to load user profile."
        );
      }
    } finally {
      setUserLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      await loadUser();
      return data;
    },
    [loadUser]
  );

  const loginWithGoogle = useCallback(
    async (firebaseIdToken: string) => {
      const data = await authApi.google(firebaseIdToken);
      await loadUser();
      return data;
    },
    [loadUser]
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
    try {
      await authApi.logout();
    } catch {
      // Logout is best-effort
    }
    setUser(null);
    setUserError(null);
  }, []);

  const updateProfile = useCallback(async (profileData: { fullName?: string; phone?: string; address?: string; gender?: string }) => {
    setUserLoading(true);
    setUserError(null);
    try {
      const res = await authApi.updateProfile(profileData);
      setUser(mergeAuthUser(res.user));
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Unable to update profile.");
      throw err;
    } finally {
      setUserLoading(false);
    }
  }, []);

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
      updateProfile,
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
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
