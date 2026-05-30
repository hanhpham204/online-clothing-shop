"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../components/AuthProvider";

type IconProps = { className?: string };

const icon = (path: React.ReactNode) =>
  function Icon({ className = "" }: IconProps) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };

const ProfileIcon = icon(
  <>
    <circle cx="10" cy="6.5" r="3.25" />
    <path d="M3.5 17c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
  </>
);
const OrdersIcon = icon(
  <>
    <path d="M4 3.5h9l3 3v10H4z" />
    <path d="M7 8h6M7 11h6M7 14h4" />
  </>
);
const WishlistIcon = icon(
  <path d="M10 16.5l-1.3-1.2C4.4 11.3 1.7 8.8 1.7 5.8 1.7 3.6 3.4 2 5.6 2c1.2 0 2.4.6 3.1 1.5C9.4 2.6 10.6 2 11.8 2 14 2 15.7 3.6 15.7 5.8c0 3-2.7 5.5-7 9.5L10 16.5z" />
);
const AddressIcon = icon(
  <>
    <path d="M10 18s6-5 6-9.5A6 6 0 004 8.5C4 13 10 18 10 18z" />
    <circle cx="10" cy="8.5" r="2" />
  </>
);
const LogoutIcon = icon(
  <>
    <path d="M12 6V4.5a1.5 1.5 0 00-1.5-1.5h-6A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17h6a1.5 1.5 0 001.5-1.5V14" />
    <path d="M8 10h9m0 0l-2.5-2.5M17 10l-2.5 2.5" />
  </>
);

const navItems = [
  { label: "Profile", Icon: ProfileIcon, active: true },
  { label: "My Orders", Icon: OrdersIcon, active: false },
  { label: "Wishlist", Icon: WishlistIcon, active: false },
  { label: "Addresses", Icon: AddressIcon, active: false },
];

const cardShadow = "shadow-[0px_4px_20px_-2px_rgba(111,89,89,0.06)]";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, userLoading, userError, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || (!isAuthenticated && !user)) {
    return (
      <AccountShell>
        <main className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-6 py-12 sm:px-16">
          <p className="text-[16px] text-text-muted">Loading your account...</p>
        </main>
      </AccountShell>
    );
  }

  if (!user) return null;

  const displayName = user.fullName || user.name || user.email;
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";
  const personalInfo = [
    { label: "Full Name", value: displayName },
    { label: "Email", value: user.email },
    { label: "Phone Number", value: user.phone || "Not provided" },
    { label: "Role", value: user.role },
  ];

  return (
    <AccountShell>
      <main className="mx-auto w-full max-w-[1440px] px-6 py-12 sm:px-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:w-64">
            <nav className={`flex flex-col gap-2 rounded-xl bg-primary p-4 ${cardShadow}`}>
              {navItems.map(({ label, Icon, active }) => (
                <a
                  key={label}
                  href="#"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium tracking-[0.14px] transition-colors ${
                    active
                      ? "bg-neutral-bg text-text-main"
                      : "text-text-muted hover:bg-neutral-bg hover:text-text-main"
                  }`}
                >
                  <Icon />
                  {label}
                </a>
              ))}
              <div className="mt-2 border-t border-border-soft pt-2">
                <LogoutButton className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium tracking-[0.14px] text-[#ba1a1a] transition-colors hover:bg-[#ba1a1a]/10 disabled:opacity-60">
                  <LogoutIcon />
                  Logout
                </LogoutButton>
              </div>
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-12">
            <section className={`flex flex-col items-start gap-8 rounded-xl bg-primary p-8 sm:flex-row ${cardShadow}`}>
              <div className="flex size-32 shrink-0 items-center justify-center rounded-full bg-secondary text-[32px] font-semibold text-[#735d5e]">
                {initials}
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="break-words font-jakarta text-[32px] font-semibold leading-tight text-text-main">
                    {displayName}
                  </h1>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.6px] text-[#735d5e]">
                    {user.role}
                  </span>
                </div>
                <p className="mt-2 break-all text-[16px] text-text-muted">{user.email}</p>
                {userLoading ? (
                  <p className="mt-3 text-[14px] text-text-muted">Refreshing profile...</p>
                ) : null}
                {userError ? (
                  <p
                    role="alert"
                    className="mt-3 rounded-lg border border-[#f0c0c0] bg-[#fbeaea] px-4 py-3 text-[14px] text-[#a13a3a]"
                  >
                    {userError}
                  </p>
                ) : null}
                <button className="mt-4 w-fit rounded-lg border border-border-soft px-6 py-2.5 text-[14px] font-medium tracking-[0.14px] text-text-main transition-colors hover:bg-neutral-bg">
                  Edit Profile
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {personalInfo.map((field) => (
                  <InfoField key={field.label} label={field.label} value={field.value} />
                ))}
                <div className="sm:col-span-2">
                  <InfoField
                    label="Shipping Address"
                    value={user.address || "Not provided"}
                  />
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                  Recent Orders
                </h2>
                <Link href="#" className="text-[14px] font-medium text-text-muted underline hover:text-text-main">
                  View All
                </Link>
              </div>
              <EmptyPanel message="No recent orders found." />
            </section>

            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                  Saved Items
                </h2>
                <Link href="#" className="text-[14px] font-medium text-text-muted underline hover:text-text-main">
                  View Wishlist
                </Link>
              </div>
              <EmptyPanel message="No saved items found." />
            </section>
          </div>
        </div>
      </main>
    </AccountShell>
  );
}

function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />
      {children}
      <Footer />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border border-border-soft bg-primary px-5 py-4 ${cardShadow}`}>
      <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted">
        {label}
      </span>
      <span className="break-words text-[16px] text-text-main">{value}</span>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className={`rounded-xl border border-border-soft bg-primary px-6 py-8 ${cardShadow}`}>
      <p className="text-[16px] text-text-muted">{message}</p>
    </div>
  );
}
