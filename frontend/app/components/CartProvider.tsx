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

const CART_STORAGE_KEY = "luala.cart.v1";

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

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartItem);
  } catch (err) {
    console.warn("Failed to read cart from localStorage:", err);
    return [];
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  // Start empty on both server and first client render to avoid hydration mismatch,
  // then hydrate from localStorage in an effect.
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    setItems(loadCartFromStorage());
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    // Only persist after the initial hydration so we don't overwrite stored data with [].
    if (!hasHydratedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to write cart to localStorage:", err);
    }
  }, [items]);

  // Sync cart across browser tabs/windows.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      setItems(loadCartFromStorage());
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
