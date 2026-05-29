"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";

const navLinks = [
  { label: "WOMEN", href: "#" },
  { label: "MEN", href: "#" },
  { label: "KIDS", href: "#" },
  { label: "COLLECTIONS", href: "/collections" },
];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="#1c1c1c" strokeWidth="1.5" />
      <path d="M12.5 12.5l3.75 3.75" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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

export default function Header({ promo }: { promo?: string }) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const { isAuthenticated } = useAuth();

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
          <Link
            href="/"
            className="font-jakarta text-[32px] font-semibold leading-none tracking-[-1.6px] text-text-main"
          >
            LUA LA
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const active = link.href !== "#" && pathname.startsWith(link.href);
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

          <div className="flex items-center gap-1">
            <button aria-label="Search" className="rounded-full p-2 transition-colors hover:bg-neutral-bg">
              <SearchIcon />
            </button>
            <button
              onClick={openCart}
              aria-label={`Shopping bag (${count} items)`}
              className="relative rounded-full p-2 transition-colors hover:bg-neutral-bg"
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
    </>
  );
}
