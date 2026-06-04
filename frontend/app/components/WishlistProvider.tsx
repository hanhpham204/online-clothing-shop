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
import { useAuth } from "./AuthProvider";

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

// New key scheme: `luala.wishlist.v1::<userId>` (or `::guest` while not
// signed in). Keeps wishlists from leaking between accounts.
const WISHLIST_KEY_PREFIX = "luala.wishlist.v1::";
const GUEST_SUFFIX = "guest";
const LEGACY_WISHLIST_KEY = "luala.wishlist.v1";

function storageKeyFor(userId: string | null | undefined): string {
  return `${WISHLIST_KEY_PREFIX}${userId || GUEST_SUFFIX}`;
}

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

function readWishlist(key: string): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidWishlistItem);
  } catch (err) {
    console.warn("Failed to read wishlist from localStorage:", err);
    return [];
  }
}

function writeWishlist(key: string, items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to write wishlist to localStorage:", err);
  }
}

function migrateLegacyGuestWishlist() {
  if (typeof window === "undefined") return;
  try {
    const legacy = window.localStorage.getItem(LEGACY_WISHLIST_KEY);
    if (!legacy) return;
    const guestKey = storageKeyFor(undefined);
    const existingGuest = window.localStorage.getItem(guestKey);
    if (!existingGuest) {
      window.localStorage.setItem(guestKey, legacy);
    }
    window.localStorage.removeItem(LEGACY_WISHLIST_KEY);
  } catch {
    // Best-effort.
  }
}

function mergeWishlists(a: WishlistItem[], b: WishlistItem[]): WishlistItem[] {
  const byId = new Map<string, WishlistItem>();
  for (const item of a) byId.set(item.id, item);
  for (const item of b) if (!byId.has(item.id)) byId.set(item.id, item);
  return Array.from(byId.values());
}

export default function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const activeKeyRef = useRef<string | null>(null);
  const itemsRef = useRef<WishlistItem[]>(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Bind the wishlist to the current account; swap stores on login/logout.
  useEffect(() => {
    if (authLoading) return;
    migrateLegacyGuestWishlist();

    const nextKey = storageKeyFor(user?.userId);
    const previousKey = activeKeyRef.current;
    if (previousKey === nextKey) return;

    if (previousKey === null) {
      activeKeyRef.current = nextKey;
      setItems(readWishlist(nextKey));
      return;
    }

    writeWishlist(previousKey, itemsRef.current);

    let nextItems = readWishlist(nextKey);
    const wasGuest = previousKey === storageKeyFor(undefined);
    const loggingIn = wasGuest && !!user?.userId;

    if (loggingIn && itemsRef.current.length > 0) {
      // For wishlists, merging is always nice — a "saved" item never hurts
      // to keep. Dedupe by id and clear guest after migration.
      nextItems = mergeWishlists(nextItems, itemsRef.current);
      writeWishlist(previousKey, []);
    }

    activeKeyRef.current = nextKey;
    setItems(nextItems);
  }, [user?.userId, authLoading]);

  useEffect(() => {
    if (!activeKeyRef.current) return;
    writeWishlist(activeKeyRef.current, items);
  }, [items]);

  // Cross-tab sync — only mirror events for the currently active key.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      const key = activeKeyRef.current;
      if (!key) return;
      if (event.key !== key) return;
      setItems(readWishlist(key));
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
