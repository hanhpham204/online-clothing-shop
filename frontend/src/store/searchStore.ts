import { create } from 'zustand';
import api from '@/lib/api';
import { Product } from '@/types';

interface SearchFilters {
  keyword: string;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  size: string | null;
  color: string | null;
  sort: string;
  page: number;
  pageSize: number;
}

interface SearchState {
  // Data
  filters: SearchFilters;
  results: Product[];
  totalPages: number;
  totalElements: number;
  suggestions: string[];
  searchHistory: string[];
  availableSizes: string[];
  availableColors: string[];

  // Loading states
  loading: boolean;
  suggestLoading: boolean;

  // Abort controller for cancelling requests
  _abortController: AbortController | null;

  // Actions
  setFilter: (key: keyof SearchFilters, value: any) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  search: () => Promise<void>;
  fetchSuggestions: (keyword: string) => Promise<void>;
  fetchSearchHistory: () => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  fetchAvailableFilters: () => Promise<void>;
  setPage: (page: number) => void;
}

const DEFAULT_FILTERS: SearchFilters = {
  keyword: '',
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  size: null,
  color: null,
  sort: 'newest',
  page: 0,
  pageSize: 12,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  filters: { ...DEFAULT_FILTERS },
  results: [],
  totalPages: 0,
  totalElements: 0,
  suggestions: [],
  searchHistory: [],
  availableSizes: [],
  availableColors: [],
  loading: false,
  suggestLoading: false,
  _abortController: null,

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: key !== 'page' ? 0 : value },
    }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 0 },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS }, results: [], totalPages: 0, totalElements: 0 });
  },

  search: async () => {
    const { filters, _abortController: prevController } = get();

    // Cancel previous request
    if (prevController) {
      prevController.abort();
    }

    const controller = new AbortController();
    set({ loading: true, _abortController: controller });

    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.set('keyword', filters.keyword);
      if (filters.categoryId) params.set('categoryId', filters.categoryId.toString());
      if (filters.minPrice !== null) params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== null) params.set('maxPrice', filters.maxPrice.toString());
      if (filters.size) params.set('size', filters.size);
      if (filters.color) params.set('color', filters.color);
      if (filters.sort) params.set('sort', filters.sort);
      params.set('page', filters.page.toString());
      params.set('pageSize', filters.pageSize.toString());

      const res = await api.get(`/products/search?${params.toString()}`, {
        signal: controller.signal,
      });

      const data = res.data.data;
      set({
        results: data.content || [],
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0,
        loading: false,
        _abortController: null,
      });
    } catch (error: any) {
      if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
        set({ results: [], totalPages: 0, totalElements: 0, loading: false, _abortController: null });
      }
    }
  },

  fetchSuggestions: async (keyword: string) => {
    if (!keyword || keyword.trim().length < 2) {
      set({ suggestions: [] });
      return;
    }

    set({ suggestLoading: true });
    try {
      const res = await api.get(`/products/suggest?keyword=${encodeURIComponent(keyword)}`);
      set({ suggestions: res.data.data || [], suggestLoading: false });
    } catch {
      set({ suggestions: [], suggestLoading: false });
    }
  },

  fetchSearchHistory: async () => {
    try {
      const res = await api.get('/search/history');
      set({ searchHistory: res.data.data || [] });
    } catch {
      set({ searchHistory: [] });
    }
  },

  clearSearchHistory: async () => {
    try {
      await api.delete('/search/history');
      set({ searchHistory: [] });
    } catch { /* ignore */ }
  },

  fetchAvailableFilters: async () => {
    try {
      const res = await api.get('/products/filters');
      const data = res.data.data;
      set({
        availableSizes: data?.sizes || [],
        availableColors: data?.colors || [],
      });
    } catch { /* ignore */ }
  },

  setPage: (page: number) => {
    set((state) => ({
      filters: { ...state.filters, page },
    }));
  },
}));
