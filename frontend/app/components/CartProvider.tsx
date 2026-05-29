"use client";

import {
  createContext,
  useContext,
  useMemo,
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
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

// Sample seed items (temporary Figma image URLs — replace with real cart data)
const initialItems: CartItem[] = [
  {
    id: "draped-linen-midi-dress",
    name: "Draped Linen Midi Dress",
    category: "Women",
    price: 145,
    qty: 1,
    image:
      "https://www.figma.com/api/mcp/asset/68dbbbf5-5427-41aa-8788-0d310b0a3ba4",
  },
  {
    id: "oversized-cashmere-blend",
    name: "Oversized Cashmere Blend",
    category: "Women",
    price: 210,
    qty: 2,
    image:
      "https://www.figma.com/api/mcp/asset/3207939c-e886-462d-b455-faa1c7c29a0b",
  },
];

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, it) => n + it.qty, 0);
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      updateQty: (id, delta) =>
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it
          )
        ),
      removeItem: (id) => setItems((prev) => prev.filter((it) => it.id !== id)),
    };
  }, [items, isOpen]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}
