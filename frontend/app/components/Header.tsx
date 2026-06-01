"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";

const navLinks = [
  { label: "WOMEN", href: "/collections?category=Women", category: "Women" },
  { label: "MEN", href: "/collections?category=Men", category: "Men" },
  { label: "KIDS", href: "/collections?category=Kids", category: "Kids" },
  { label: "COLLECTIONS", href: "/collections", category: null },
];

// function SearchIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
//       <circle cx="8" cy="8" r="6.25" stroke="#1c1c1c" strokeWidth="1.5" />
//       <path d="M12.5 12.5l3.75 3.75" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" />
//     </svg>
//   );
// }

function BagIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path
        d="M1 6h14l-.9 12.1a1 1 0 01-1 .9H2.9a1 1 0 01-1-.9L1 6z"
        stroke="#1c1c1c"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M5 7V4.5a3 3 0 016 0V7" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="5.5" r="3.25" stroke="#1c1c1c" strokeWidth="1.5" />
      <path
        d="M2.5 16c.7-3.3 3.2-5 6.5-5s5.8 1.7 6.5 5"
        stroke="#1c1c1c"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function HeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const onCollections = pathname?.startsWith("/collections");

  return (
    <nav className="hidden items-center gap-8 md:flex">
      {navLinks.map((link) => {
        let active = false;
        if (link.category) {
          // Category-specific nav: highlight only when /collections is open
          // AND the URL's ?category= matches this link.
          active = !!onCollections && activeCategory?.toLowerCase() === link.category.toLowerCase();
        } else if (link.href === "/collections") {
          // "Collections" without a filter: highlight on the bare /collections.
          active = !!onCollections && !activeCategory;
        }
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`text-xs font-semibold uppercase tracking-[0.6px] transition-colors ${
              active
                ? "border-b border-accent pb-1 text-accent hover:text-accent-hover"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Header({ promo }: { promo?: string }) {
  const { count, openCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {promo ? (
        <div className="flex items-center justify-center bg-secondary px-6 py-2 sm:px-16">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.6px] text-[#735d5e]">
            {promo}
          </p>
        </div>
      ) : null}

      <header className="sticky top-0 z-50 backdrop-blur-md bg-neutral-bg/80 shadow-[0px_1px_2px_0px_rgba(111,89,89,0.05)]">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 sm:px-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex md:hidden p-2 -ml-2 rounded-full hover:bg-neutral-bg cursor-pointer text-text-main"
              aria-label="Open navigation menu"
            >
              <HamburgerIcon />
            </button>
            <Link
              href="/"
              className="font-jakarta text-[32px] font-semibold leading-none tracking-[-1.6px] text-text-main"
            >
              LUA LA
            </Link>
          </div>

          <Suspense fallback={<nav className="hidden md:flex" aria-hidden="true" />}>
            <HeaderNav />
          </Suspense>

          <div className="flex items-center gap-1">
            <button
              onClick={openCart}
              aria-label={`Shopping bag (${count} items)`}
              className="relative rounded-full p-2 transition-colors hover:bg-neutral-bg cursor-pointer"
            >
              <BagIcon />
              {count > 0 ? (
                <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-white">
                  {count}
                </span>
              ) : null}
            </button>
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              aria-label={isAuthenticated ? "My account" : "Sign in"}
              className="rounded-full p-2 transition-colors hover:bg-neutral-bg"
            >
              <ProfileIcon />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-100 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-text-main/30 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <nav className="fixed inset-y-0 left-0 w-full max-w-[300px] bg-primary shadow-2xl flex flex-col p-6 gap-6 z-100 transition-transform duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-soft">
              <span className="font-jakarta text-[24px] font-semibold tracking-[-1.2px] text-text-main">
                LUA LA
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-neutral-bg rounded-full transition-colors cursor-pointer text-text-main"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            {/* Drawer Links */}
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold uppercase tracking-[0.8px] text-text-muted hover:text-text-main py-2 border-b border-neutral-bg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
