import { create } from 'zustand';
import { User } from '@/types';
import api, { clearAccessToken, setAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  loadUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('user');
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user } = res.data.data;
    setAccessToken(accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
    return user;
  },

  register: async (email, password, fullName, phone) => {
    const res = await api.post('/auth/register', { email, password, fullName, phone });
    const { accessToken, user } = res.data.data;
    setAccessToken(accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore - token may already be expired */ }
    clearAccessToken();
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/users/me');
      const user = res.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearAccessToken();
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
