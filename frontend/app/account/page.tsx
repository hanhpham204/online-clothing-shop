/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LogoutButton from "../components/LogoutButton";

// Temporary Figma asset URLs — replace with real user data/images before production
const avatar =
  "https://www.figma.com/api/mcp/asset/f53aca59-7215-4ea5-ad81-60f1f7774fe9";
const drapedLinenDress =
  "https://www.figma.com/api/mcp/asset/4b4c56da-7787-4683-b6e8-202cc6af3109";
const oversizedCashmere =
  "https://www.figma.com/api/mcp/asset/3cd87fd2-4c37-4800-9fc7-c5aab0af6268";

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
const PaymentIcon = icon(
  <>
    <rect x="2.5" y="5" width="15" height="10" rx="2" />
    <path d="M2.5 8.5h15" />
  </>
);
const NotificationsIcon = icon(
  <>
    <path d="M6 8a4 4 0 018 0c0 4 1.5 5 1.5 5h-11S6 12 6 8z" />
    <path d="M8.5 16a1.5 1.5 0 003 0" />
  </>
);
const SettingsIcon = icon(
  <>
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15 5l-1.4 1.4M6.4 13.6 5 15M15 15l-1.4-1.4M6.4 6.4 5 5" />
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
  { label: "Payment Methods", Icon: PaymentIcon, active: false },
  { label: "Notifications", Icon: NotificationsIcon, active: false },
  { label: "Account Settings", Icon: SettingsIcon, active: false },
];

const personalInfo = [
  { label: "Full Name", value: "Sarah Jenkins" },
  { label: "Email", value: "sarah.j@example.com" },
  { label: "Phone Number", value: "+1 (555) 123-4567" },
  { label: "Date of Birth", value: "October 12, 1990" },
];

const orders = [
  {
    id: "LL-8291",
    date: "Placed on May 15, 2024",
    status: "Processing",
    tone: "neutral" as const,
    price: "$245.00",
  },
  {
    id: "LL-7420",
    date: "Placed on April 28, 2024",
    status: "Delivered",
    tone: "accent" as const,
    price: "$128.50",
  },
];

const savedItems = [
  { name: "Draped Linen Dress", variant: "Natural", price: "$185.00", image: drapedLinenDress },
  { name: "Oversized Cashmere Blend", variant: "Heather Gray", price: "$220.00", image: oversizedCashmere },
];

const cardShadow = "shadow-[0px_4px_20px_-2px_rgba(111,89,89,0.06)]";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />

      <main className="mx-auto w-full max-w-[1440px] px-6 py-12 sm:px-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ── Sidebar ── */}
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

          {/* ── Content ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-12">
            {/* Profile header */}
            <section className={`flex flex-col items-start gap-8 rounded-xl bg-primary p-8 sm:flex-row ${cardShadow}`}>
              <div className="size-32 shrink-0 overflow-hidden rounded-full bg-[#eeeee9]">
                <img src={avatar} alt="Sarah Jenkins" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-jakarta text-[32px] font-semibold leading-tight text-text-main">
                    Sarah Jenkins
                  </h1>
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.6px] text-[#735d5e]">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                      <path d="M1 4l3 2.5L7 1l3 5.5L13 4l-1 8H2L1 4z" />
                    </svg>
                    Premium Member
                  </span>
                </div>
                <p className="mt-2 text-[16px] text-text-muted">sarah.j@example.com</p>
                <button className="mt-4 w-fit rounded-lg border border-border-soft px-6 py-2.5 text-[14px] font-medium tracking-[0.14px] text-text-main transition-colors hover:bg-neutral-bg">
                  Edit Profile
                </button>
              </div>
            </section>

            {/* Personal Information */}
            <section className="flex flex-col gap-6">
              <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {personalInfo.map((field) => (
                  <InfoField key={field.label} label={field.label} value={field.value} />
                ))}
                <div className="sm:col-span-2">
                  <InfoField label="Gender" value="Female" />
                </div>
              </div>
            </section>

            {/* Recent Orders */}
            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                  Recent Orders
                </h2>
                <Link href="#" className="text-[14px] font-medium text-text-muted underline hover:text-text-main">
                  View All
                </Link>
              </div>
              <div className={`divide-y divide-border-soft overflow-hidden rounded-xl border border-border-soft bg-primary ${cardShadow}`}>
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-4 p-6">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[14px] font-medium tracking-[0.14px] text-text-main">
                        Order #{order.id}
                      </p>
                      <p className="text-[16px] text-text-muted">{order.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                          order.tone === "accent"
                            ? "bg-secondary text-[#735d5e]"
                            : "bg-neutral-bg text-text-muted"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="hidden text-[16px] text-text-main sm:block">{order.price}</span>
                      <ChevronRight />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Saved Items */}
            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                  Saved Items
                </h2>
                <Link href="#" className="text-[14px] font-medium text-text-muted underline hover:text-text-main">
                  View Wishlist
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedItems.map((item) => (
                  <article key={item.name} className={`group flex flex-col overflow-hidden rounded-xl bg-primary ${cardShadow}`}>
                    <div className="relative h-[366px] w-full overflow-hidden bg-[#eeeee9]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full scale-105 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <button
                        aria-label={`Remove ${item.name} from wishlist`}
                        className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-neutral-bg/80 backdrop-blur-sm transition-transform hover:scale-105"
                      >
                        <svg width="17" height="16" viewBox="0 0 20 18" fill="#9a4f5b" aria-hidden="true">
                          <path d="M10 17l-1.45-1.32C3.4 11.03.5 8.4.5 5.19.5 2.6 2.54.75 5.1.75c1.45 0 2.84.67 3.75 1.74.91-1.07 2.3-1.74 3.75-1.74 2.56 0 4.6 1.85 4.6 4.44 0 3.21-2.9 5.84-8.05 10.5L10 17z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 p-4">
                      <h3 className="text-[14px] font-medium tracking-[0.14px] text-text-main">{item.name}</h3>
                      <p className="text-[16px] text-text-muted">{item.variant}</p>
                      <p className="mt-1 text-[16px] text-text-main">{item.price}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Shipping Address */}
            <section className="flex flex-col gap-6">
              <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Default address */}
                <div className={`relative rounded-xl border-2 border-border-soft bg-primary p-6 ${cardShadow}`}>
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button aria-label="Edit address" className="flex size-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-neutral-bg hover:text-text-main">
                      <EditIcon />
                    </button>
                    <button aria-label="Delete address" className="flex size-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-neutral-bg hover:text-[#ba1a1a]">
                      <TrashIcon />
                    </button>
                  </div>
                  <span className="inline-block rounded bg-neutral-bg px-2 py-1 text-[12px] font-semibold text-text-muted">
                    Default
                  </span>
                  <p className="mt-3 text-[14px] font-medium tracking-[0.14px] text-text-main">Sarah Jenkins</p>
                  <div className="mt-1 space-y-0.5 text-[16px] text-text-muted">
                    <p>1234 Willow Lane, Apt 4B</p>
                    <p>San Francisco, CA 94107</p>
                    <p>United States</p>
                  </div>
                </div>

                {/* Add new address */}
                <button className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#c4c7c8] bg-primary/40 text-text-muted transition-colors hover:bg-primary hover:text-text-main">
                  <span className="flex size-10 items-center justify-center rounded-full border border-current">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M10 4.5v11M4.5 10h11" />
                    </svg>
                  </span>
                  <span className="text-[14px] font-medium tracking-[0.14px]">Add New Address</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

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
      <span className="text-[16px] text-text-main">{value}</span>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true">
      <path d="M1.5 1.5L6.5 6.5l-5 5" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5 2.5l2 2L6 12l-3 1 1-3 7.5-7.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="15" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4h10M5 4V2.5h4V4M3 4l.6 9.5h6.8L11 4" />
    </svg>
  );
}
