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
import CartDrawer from "./CartDrawer";
import { useAuth } from "./AuthProvider";

export type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  qty: number;
  image: string;
  size?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// New key scheme is `luala.cart.v1::<userId>` (or `::guest` while not signed
// in). This isolates the cart per account so accounts don't leak data into
// each other.
const CART_KEY_PREFIX = "luala.cart.v1::";
const GUEST_SUFFIX = "guest";
// Legacy key from before per-account scoping; migrated into the guest bucket
// on first load so existing users don't lose their cart.
const LEGACY_CART_KEY = "luala.cart.v1";

function storageKeyFor(userId: string | null | undefined): string {
  return `${CART_KEY_PREFIX}${userId || GUEST_SUFFIX}`;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.price === "number" &&
    typeof item.qty === "number" &&
    typeof item.image === "string" &&
    (item.size === undefined || typeof item.size === "string")
  );
}

function readCart(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartItem);
  } catch (err) {
    console.warn("Failed to read cart from localStorage:", err);
    return [];
  }
}

function writeCart(key: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to write cart to localStorage:", err);
  }
}

function migrateLegacyGuestCart() {
  if (typeof window === "undefined") return;
  try {
    const legacy = window.localStorage.getItem(LEGACY_CART_KEY);
    if (!legacy) return;
    const guestKey = storageKeyFor(undefined);
    const existingGuest = window.localStorage.getItem(guestKey);
    if (!existingGuest) {
      window.localStorage.setItem(guestKey, legacy);
    }
    window.localStorage.removeItem(LEGACY_CART_KEY);
  } catch {
    // Best-effort — if storage throws we just skip the migration.
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Tracks which storage key the in-memory items are bound to. `null` means
  // we haven't decided yet (auth is still loading on first paint).
  const activeKeyRef = useRef<string | null>(null);
  // Mirror of `items` so the auth-change effect can read the latest value
  // without re-running every time items change.
  const itemsRef = useRef<CartItem[]>(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Bind the cart to the current account, swapping storage when the
  // signed-in user changes.
  useEffect(() => {
    if (authLoading) return;
    migrateLegacyGuestCart();

    const nextKey = storageKeyFor(user?.userId);
    const previousKey = activeKeyRef.current;
    if (previousKey === nextKey) return;

    if (previousKey === null) {
      // First hydration — load whatever the active account has stored.
      activeKeyRef.current = nextKey;
      setItems(readCart(nextKey));
      return;
    }

    // Account just changed (login, logout, or account switch). Persist the
    // in-memory cart back to the previous account's bucket so nothing is lost.
    writeCart(previousKey, itemsRef.current);

    let nextItems = readCart(nextKey);
    const wasGuest = previousKey === storageKeyFor(undefined);
    const loggingIn = wasGuest && !!user?.userId;

    if (loggingIn && nextItems.length === 0 && itemsRef.current.length > 0) {
      // Friendly migrate: signed-in user had no saved cart yet, so carry the
      // guest cart over and clear the guest bucket to avoid duplication.
      nextItems = itemsRef.current;
      writeCart(previousKey, []);
    }

    activeKeyRef.current = nextKey;
    setItems(nextItems);
  }, [user?.userId, authLoading]);

  // Persist on cart mutations once we're bound to a key.
  useEffect(() => {
    if (!activeKeyRef.current) return;
    writeCart(activeKeyRef.current, items);
  }, [items]);

  // Cross-tab sync — only react to the currently active account's key so a
  // different account in another tab can't bleed data into this one.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      const key = activeKeyRef.current;
      if (!key) return;
      if (event.key !== key) return;
      setItems(readCart(key));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const updateQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it,
      ),
    );
  }, []);
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);
  const clearCart = useCallback(() => setItems([]), []);
  const addItem = useCallback((item: Omit<CartItem, "qty"> & { qty?: number }) => {
    const qtyToAdd = item.qty ?? 1;
    const size = item.size || "M";
    const cartId = item.id.includes("-") ? item.id : `${item.id}-${size}`;
    setItems((prev) => {
      const exists = prev.find((it) => it.id === cartId);
      if (exists) {
        return prev.map((it) =>
          it.id === cartId ? { ...it, qty: it.qty + qtyToAdd } : it,
        );
      }
      return [...prev, { ...item, id: cartId, size, qty: qtyToAdd }];
    });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, it) => n + it.qty, 0);
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      updateQty,
      removeItem,
      clearCart,
      addItem,
    };
  }, [items, isOpen, openCart, closeCart, updateQty, removeItem, clearCart, addItem]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}
