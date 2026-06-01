"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type WishlistItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  has: (id: string) => boolean;
  toggle: (item: WishlistItem) => boolean;
  add: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const WISHLIST_STORAGE_KEY = "luala.wishlist.v1";

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}

function isValidWishlistItem(value: unknown): value is WishlistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.price === "number" &&
    typeof item.image === "string"
  );
}

function loadFromStorage(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidWishlistItem);
  } catch (err) {
    console.warn("Failed to read wishlist from localStorage:", err);
    return [];
  }
}

export default function WishlistProvider({ children }: { children: ReactNode }) {
  // Start empty on both server and first client render to avoid hydration
  // mismatch, then hydrate from localStorage in an effect.
  const [items, setItems] = useState<WishlistItem[]>([]);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    setItems(loadFromStorage());
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to write wishlist to localStorage:", err);
    }
  }, [items]);

  // Sync wishlist across tabs/windows.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== WISHLIST_STORAGE_KEY) return;
      setItems(loadFromStorage());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const has = useCallback(
    (id: string) => items.some((it) => it.id === id),
    [items],
  );

  const add = useCallback((item: WishlistItem) => {
    setItems((prev) => (prev.some((it) => it.id === item.id) ? prev : [...prev, item]));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const toggle = useCallback((item: WishlistItem): boolean => {
    let isNowInWishlist = false;
    setItems((prev) => {
      const exists = prev.some((it) => it.id === item.id);
      if (exists) {
        isNowInWishlist = false;
        return prev.filter((it) => it.id !== item.id);
      }
      isNowInWishlist = true;
      return [...prev, item];
    });
    return isNowInWishlist;
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      has,
      toggle,
      add,
      remove,
      clear,
    }),
    [items, has, toggle, add, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
