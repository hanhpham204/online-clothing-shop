/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";

const formatPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 3v8M3 7h8" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 8h18l-1.2 12.2a1.5 1.5 0 01-1.5 1.3H5.7a1.5 1.5 0 01-1.5-1.3L3 8z"
        stroke="#9a4f5b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 9V6a4 4 0 018 0v3" stroke="#9a4f5b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, updateQty, removeItem } =
    useCart();

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  return (
    <div
      className={`fixed inset-0 z-60 ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-text-main/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-primary shadow-[0px_10px_60px_-12px_rgba(111,89,89,0.35)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-5">
          <h2 className="font-jakarta text-[20px] font-semibold text-text-main">
            Shopping Bag{" "}
            <span className="text-text-muted">({count})</span>
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-bg"
          >
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary/40">
              <BagIcon />
            </div>
            <div>
              <p className="font-jakarta text-[18px] font-semibold text-text-main">
                Your bag is empty
              </p>
              <p className="mt-1 text-[14px] text-text-muted">
                Discover pieces you&apos;ll love and add them here.
              </p>
            </div>
            <Link
              href="/collections"
              onClick={closeCart}
              className="mt-2 rounded-full bg-accent px-8 py-3 text-[14px] font-medium uppercase tracking-[0.7px] text-white transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              Shop Collections
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <ul className="flex-1 divide-y divide-border-soft overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-bg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-medium leading-[1.4] text-text-main">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-neutral-bg hover:text-text-main"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                    <p className="text-[13px] text-text-muted">{item.category}</p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-3 rounded-full border border-border-soft px-2 py-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          aria-label="Decrease quantity"
                          disabled={item.qty <= 1}
                          className="flex size-6 items-center justify-center rounded-full transition-colors hover:bg-neutral-bg disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <MinusIcon />
                        </button>
                        <span className="min-w-4 text-center text-[14px] font-medium text-text-main">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          aria-label="Increase quantity"
                          className="flex size-6 items-center justify-center rounded-full transition-colors hover:bg-neutral-bg"
                        >
                          <PlusIcon />
                        </button>
                      </div>

                      <p className="text-[15px] font-medium text-text-main font-jakarta">
                        {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer / summary */}
            <div className="space-y-4 border-t border-border-soft p-6">
              <div className="flex items-center justify-between text-[16px]">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-jakarta text-[18px] font-semibold text-text-main">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-[12px] text-text-muted">
                Shipping &amp; taxes calculated at checkout.
              </p>
              <button className="w-full rounded-full bg-accent py-4 text-[14px] font-medium uppercase tracking-[0.7px] text-white transition-all hover:bg-accent-hover active:scale-[0.99]">
                Checkout
              </button>
              <button
                onClick={closeCart}
                className="w-full rounded-full border border-border-soft py-3 text-[14px] font-medium uppercase tracking-[0.7px] text-text-main transition-colors hover:bg-neutral-bg"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
