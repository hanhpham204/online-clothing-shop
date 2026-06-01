"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  formatVnd,
  getAccountDisplayName,
  getBankDisplayInfo,
  getPaymentQrUrl,
  getVaAccountNumber,
} from "@/lib/payment-qr";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../components/AuthProvider";
import { useCart } from "../components/CartProvider";
import { useWishlist } from "../components/WishlistProvider";

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
  { label: "Profile", Icon: ProfileIcon },
  { label: "My Orders", Icon: OrdersIcon },
  { label: "Wishlist", Icon: WishlistIcon },
  { label: "Addresses", Icon: AddressIcon },
];

const cardShadow = "shadow-[0px_4px_20px_-2px_rgba(111,89,89,0.06)]";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image?: string;
}

interface Order {
  _id: string;
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, userLoading, userError, isAuthenticated, updateProfile } = useAuth();
  const { items: wishlistItems, remove: removeFromWishlist, clear: clearWishlist } = useWishlist();
  const { addItem: addToCart, openCart } = useCart();

  // Tab State
  const [activeTab, setActiveTab] = useState("Profile");

  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", address: "", gender: "" });
  const [phoneError, setPhoneError] = useState("");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Pay QR States
  const [selectedOrderIdForPay, setSelectedOrderIdForPay] = useState<string | null>(null);
  const [payQrLoading, setPayQrLoading] = useState(false);
  const [payQrDetails, setPayQrDetails] = useState<{
    transferContent: string;
    amount: number;
    vaNumber?: string;
    bankName?: string;
    qrCodeUrl?: string;
    vaHolderName?: string;
    expiredAt?: string;
  } | null>(null);

  const bankInfo = getBankDisplayInfo();

  const handleShowPayQr = async (orderId: string) => {
    if (selectedOrderIdForPay === orderId) {
      setSelectedOrderIdForPay(null);
      setPayQrDetails(null);
      return;
    }
    setSelectedOrderIdForPay(orderId);
    setPayQrLoading(true);
    setPayQrDetails(null);
    try {
      const res = await fetch(`/api/payments/order/${orderId}`);
      if (!res.ok) throw new Error("Failed to load payment details");
      const data = await res.json();
      setPayQrDetails(data);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load payment details.");
      setSelectedOrderIdForPay(null);
    } finally {
      setPayQrLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        gender: (user as any).gender || "",
      });
      setPhoneError("");
    }
  }, [user]);

  // Fetch orders of the user
  useEffect(() => {
    if (user && (activeTab === "My Orders" || activeTab === "Profile")) {
      setOrdersLoading(true);
      fetch(`/api/orders?userId=${user.userId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch orders");
          return res.json();
        })
        .then((data) => {
          setOrders(data || []);
        })
        .catch((err) => {
          console.error("Failed to load orders:", err);
        })
        .finally(() => {
          setOrdersLoading(false);
        });
    }
  }, [user, activeTab]);

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
    { label: "Gender", value: (user as any).gender || "Not provided" },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.phone && !/^0\d{9}$/.test(editForm.phone)) {
      toast.error("Phone number must start with 0 and be exactly 10 digits.");
      return;
    }
    try {
      await updateProfile(editForm);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    }
  };

  const handleAddWishlistItemToCart = (itemId: string) => {
    const item = wishlistItems.find((it) => it.id === itemId);
    if (!item) return;
    addToCart({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
    });
    toast.success(`Added "${item.name}" to cart`);
  };

  const handleRemoveWishlistItem = (itemId: string) => {
    const item = wishlistItems.find((it) => it.id === itemId);
    removeFromWishlist(itemId);
    if (item) toast(`Removed "${item.name}" from your wishlist`);
  };

  const handleClearWishlist = () => {
    if (wishlistItems.length === 0) return;
    clearWishlist();
    toast("Wishlist cleared");
  };

  // Helper render status labels
  const getPaymentStatusBadge = (status: string, paymentMethod?: string) => {
    if (status === "PAID") {
      return <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2.5 py-0.5 rounded font-medium">Paid</span>;
    }
    if (status === "FAILED") {
      return <span className="bg-rose-500/10 text-rose-500 text-xs px-2.5 py-0.5 rounded font-medium">Payment Failed</span>;
    }
    if (paymentMethod === "COD") {
      return <span className="bg-green-500/10 text-green-400 text-xs px-2.5 py-0.5 rounded font-medium">COD</span>;
    }
    return <span className="bg-amber-500/10 text-amber-500 text-xs px-2.5 py-0.5 rounded font-medium">Pending Payment</span>;
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="text-slate-200 bg-slate-800 text-xs px-2.5 py-0.5 rounded font-medium">Confirmed</span>;
      case "SHIPPED":
        return <span className="text-blue-400 bg-blue-500/10 text-xs px-2.5 py-0.5 rounded font-medium">Shipped</span>;
      case "DELIVERED":
        return <span className="text-emerald-400 bg-emerald-500/10 text-xs px-2.5 py-0.5 rounded font-medium">Delivered</span>;
      case "CANCELLED":
        return <span className="text-rose-400 bg-rose-500/10 text-xs px-2.5 py-0.5 rounded font-medium">Cancelled</span>;
      default:
        return <span className="text-amber-400 bg-amber-500/10 text-xs px-2.5 py-0.5 rounded font-medium">Pending</span>;
    }
  };

  return (
    <AccountShell>
      <main className="mx-auto w-full max-w-[1440px] px-6 py-12 pb-24 sm:px-16 lg:pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Sidebar Navigation (Desktop) & Bottom Navigation (Mobile/Tablet) */}
          <aside className="w-full shrink-0 lg:w-64 lg:sticky lg:top-24 z-40">
            {/* Desktop Navigation: Hidden below lg, vertical stack */}
            <nav className={`hidden lg:flex flex-col gap-2 rounded-xl bg-primary p-4 ${cardShadow}`}>
              {navItems.map(({ label, Icon }) => {
                const showBadge = label === "Wishlist" && wishlistItems.length > 0;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setActiveTab(label);
                      setIsEditing(false);
                    }}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium tracking-[0.14px] transition-colors text-left w-full cursor-pointer ${
                      activeTab === label
                        ? "bg-neutral-bg text-text-main"
                        : "text-text-muted hover:bg-neutral-bg hover:text-text-main"
                    }`}
                  >
                    <Icon />
                    <span className="flex-1">{label}</span>
                    {showBadge && (
                      <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
                        {wishlistItems.length}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="mt-2 border-t border-border-soft pt-2">
                <LogoutButton className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium tracking-[0.14px] text-[#ba1a1a] transition-colors hover:bg-[#ba1a1a]/10 disabled:opacity-60">
                  <LogoutIcon />
                  Logout
                </LogoutButton>
              </div>
            </nav>

            {/* Mobile/Tablet Bottom Sticky Navigation: Fixed at bottom, hidden on lg */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-border-soft px-2 py-2 flex flex-row justify-around items-center z-50 shadow-[0_-4px_16px_rgba(111,89,89,0.06)] backdrop-blur-md bg-primary/95">
              {navItems.map(({ label, Icon }) => {
                const showBadge = label === "Wishlist" && wishlistItems.length > 0;
                const isActive = activeTab === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setActiveTab(label);
                      setIsEditing(false);
                    }}
                    className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
                      isActive ? "text-accent" : "text-text-muted hover:text-text-main"
                    }`}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {showBadge && (
                        <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold leading-none text-white">
                          {wishlistItems.length}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium tracking-wide">{label}</span>
                  </button>
                );
              })}
              {/* Logout tab for mobile/tablet */}
              <LogoutButton className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[#ba1a1a] hover:bg-red-50/10 rounded-lg transition-colors cursor-pointer">
                <LogoutIcon className="w-5 h-5" />
                <span className="text-[10px] font-medium tracking-wide">Logout</span>
              </LogoutButton>
            </nav>
          </aside>

          {/* Right Panels Content */}
          <div className="flex min-w-0 flex-1 flex-col gap-12">
            
            {/* 1. TAB: PROFILE */}
            {activeTab === "Profile" && (
              <>
                <section className={`flex flex-col items-start gap-8 rounded-xl bg-primary p-8 sm:flex-row ${cardShadow}`}>
                  <div className="flex size-32 shrink-0 items-center justify-center rounded-full bg-secondary text-[32px] font-semibold text-[#735d5e]">
                    {initials}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="break-words font-jakarta text-[32px] font-semibold leading-tight text-text-main">
                        {displayName}
                      </h1>
                    </div>
                    <p className="mt-2 break-all text-[16px] text-text-muted">{user.email}</p>
                    {userLoading && <p className="mt-3 text-[14px] text-text-muted">Saving profile...</p>}
                    {userError && (
                      <p role="alert" className="mt-3 rounded-lg border border-[#f0c0c0] bg-[#fbeaea] px-4 py-3 text-[14px] text-[#a13a3a]">
                        {userError}
                      </p>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 w-fit rounded-lg border border-border-soft px-6 py-2.5 text-[14px] font-medium tracking-[0.14px] text-text-main transition-colors hover:bg-neutral-bg cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </section>

                <section className="flex flex-col gap-6">
                  <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                    Personal Information
                  </h2>
                  {isEditing ? (
                    <form onSubmit={handleSave} className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted">Full Name</label>
                          <input
                            type="text"
                            value={editForm.fullName}
                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            className="rounded-lg border border-border-soft bg-neutral-bg px-4 py-3 text-[15px] text-text-main outline-none focus:border-text-muted transition-colors"
                            placeholder="e.g. John Doe"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted">Phone Number</label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => {
                              const val = e.target.value;
                              const filtered = val.replace(/\D/g, "").slice(0, 10);
                              setEditForm({ ...editForm, phone: filtered });
                              if (filtered.length > 0 && !/^0\d{9}$/.test(filtered)) {
                                setPhoneError("Phone number must start with 0 and be exactly 10 digits.");
                              } else {
                                setPhoneError("");
                              }
                            }}
                            className="rounded-lg border border-border-soft bg-neutral-bg px-4 py-3 text-[15px] text-text-main outline-none focus:border-text-muted transition-colors"
                            placeholder="e.g. 0912345678"
                          />
                          {phoneError && (
                            <span className="text-[12px] text-[#ba1a1a] font-medium mt-0.5">
                              {phoneError}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted">Gender</label>
                          <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                            className="rounded-lg border border-border-soft bg-neutral-bg px-4 py-3 text-[15px] text-text-main outline-none focus:border-text-muted transition-colors"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted">Shipping Address</label>
                          <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            className="rounded-lg border border-border-soft bg-neutral-bg px-4 py-3 text-[15px] text-text-main outline-none focus:border-text-muted transition-colors"
                            placeholder="e.g. 123 Nguyen Trai, District 5, HCMC"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={userLoading}
                          className="rounded-lg bg-text-main text-primary px-6 py-2.5 text-[14px] font-medium tracking-[0.14px] hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                        >
                          {userLoading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="rounded-lg border border-border-soft px-6 py-2.5 text-[14px] font-medium tracking-[0.14px] text-text-main hover:bg-neutral-bg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {personalInfo.map((field) => (
                        <InfoField key={field.label} label={field.label} value={field.value} />
                      ))}
                      <div className="sm:col-span-2">
                        <InfoField label="Shipping Address" value={user.address || "Not provided"} />
                      </div>
                    </div>
                  )}
                </section>

                {/* Quick Recent Orders summary */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-end justify-between">
                    <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
                      Recent Orders
                    </h2>
                    <button
                      onClick={() => setActiveTab("My Orders")}
                      className="text-[14px] font-medium text-text-muted underline hover:text-text-main cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  {ordersLoading ? (
                    <p className="text-[14px] text-text-muted">Loading recent orders...</p>
                  ) : orders.length === 0 ? (
                    <EmptyPanel message="No recent orders found." />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {orders.slice(0, 2).map((order) => (
                        <OrderCompactCard key={order._id} order={order} getPaymentStatusBadge={getPaymentStatusBadge} getOrderStatusLabel={getOrderStatusLabel} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* 2. TAB: MY ORDERS */}
            {activeTab === "My Orders" && (
              <section className="flex flex-col gap-6">
                <h1 className="font-jakarta text-[28px] font-bold text-text-main tracking-tight">My Orders</h1>
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyPanel message="You have not placed any orders yet." />
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order._id} className={`rounded-xl border border-border-soft bg-primary p-6 ${cardShadow} space-y-4`}>
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-border-soft">
                          <div>
                            <span className="text-[12px] font-bold uppercase tracking-wider text-text-muted">Order</span>
                            <h3 className="font-mono text-sm font-semibold text-text-main mt-0.5">#{order._id}</h3>
                            <p className="text-xs text-text-muted mt-1">
                              Order date: {new Date(order.createdAt).toLocaleDateString("en-US")}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}
                            {getOrderStatusLabel(order.orderStatus)}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-border-soft">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                              <div className="w-12 h-16 bg-neutral-bg rounded-lg overflow-hidden shrink-0 border border-border-soft">
                                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-xs font-semibold text-text-main line-clamp-1">{item.name}</h4>
                                  <p className="text-[10px] text-text-muted mt-0.5">Size: {item.size}</p>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium mt-1">
                                  <span className="text-text-muted">Qty: {item.quantity}</span>
                                  <span className="text-text-main">${item.price.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer Summary */}
                        <div className="pt-4 border-t border-border-soft flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm">
                          <div className="text-xs text-text-muted leading-relaxed">
                            <p><strong>Recipient:</strong> {order.fullName} | {order.phoneNumber}</p>
                            <p className="mt-0.5"><strong>Address:</strong> {order.shippingAddress}</p>
                            <p className="mt-0.5"><strong>Payment Method:</strong> {order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Bank Transfer (SePay)"}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-xs text-text-muted">Total Amount:</span>
                            <p className="text-lg font-bold text-text-main font-jakarta mt-0.5">${order.totalAmount.toLocaleString()}</p>
                            {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "PENDING" && (
                              <button
                                onClick={() => handleShowPayQr(order._id)}
                                className="mt-2 text-xs font-semibold px-4 py-2 bg-text-main text-primary rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-sm"
                              >
                                {selectedOrderIdForPay === order._id ? "Close QR" : "Pay Now"}
                              </button>
                            )}
                          </div>
                        </div>

                        {selectedOrderIdForPay === order._id && (
                          <div className="mt-4 pt-4 border-t border-dashed border-border-soft flex flex-col items-center gap-4 bg-neutral-bg/30 p-4 rounded-xl">
                            {payQrLoading && (
                              <div className="flex flex-col items-center justify-center py-6 gap-2">
                                <div className="w-6 h-6 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-text-muted">Loading QR...</span>
                              </div>
                            )}
                            {payQrDetails && (
                              <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-lg">
                                <div className="bg-white p-3 rounded-xl max-w-[200px] shrink-0 shadow-lg border border-border-soft">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getPaymentQrUrl(payQrDetails, bankInfo)}
                                    alt="Payment QR"
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                                <div className="flex-1 text-xs text-text-muted space-y-2 w-full text-left">
                                  <div className="flex justify-between">
                                    <span>Bank:</span>
                                    <span className="font-semibold text-text-main">
                                      {payQrDetails.bankName || bankInfo.bankId} {bankInfo.isVa ? "(Virtual Account)" : ""}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Account Number:</span>
                                    <span className="font-mono font-semibold text-text-main">
                                      {getVaAccountNumber(payQrDetails, bankInfo)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Account Name:</span>
                                    <span className="font-semibold text-text-main">{getAccountDisplayName(payQrDetails, bankInfo)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Amount:</span>
                                    <span className="font-bold text-text-main">{formatVnd(payQrDetails.amount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Message:</span>
                                    <span className="font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                                      LUALA {payQrDetails.transferContent}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 3. TAB: WISHLIST */}
            {activeTab === "Wishlist" && (
              <section className="flex flex-col gap-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h1 className="font-jakarta text-[28px] font-bold text-text-main tracking-tight">
                      Wishlist
                    </h1>
                    <p className="mt-1 text-[14px] text-text-muted">
                      {wishlistItems.length === 0
                        ? "Save items you love by tapping the heart on any product."
                        : `${wishlistItems.length} saved ${wishlistItems.length === 1 ? "item" : "items"}`}
                    </p>
                  </div>
                  {wishlistItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearWishlist}
                      className="text-[12px] font-medium text-text-muted underline hover:text-text-main cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {wishlistItems.length === 0 ? (
                  <div className={`flex flex-col items-center gap-4 rounded-xl border border-border-soft bg-primary px-6 py-12 text-center ${cardShadow}`}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <svg width="22" height="22" viewBox="0 0 20 19" fill="none" aria-hidden="true">
                        <path
                          d="M10 16.5l-1.3-1.18C4.1 11.18 1.25 8.6 1.25 5.44 1.25 3.06 3.12 1.25 5.5 1.25c1.34 0 2.63.62 3.5 1.62.87-1 2.16-1.62 3.5-1.62 2.38 0 4.25 1.81 4.25 4.19 0 3.16-2.85 5.74-7.45 9.88L10 16.5z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-text-main">Your wishlist is empty</p>
                      <p className="mt-1 text-[14px] text-text-muted">
                        Tap the heart icon on any product to save it here.
                      </p>
                    </div>
                    <Link
                      href="/collections"
                      className="mt-2 inline-flex items-center rounded-full bg-text-main px-6 py-2.5 text-[13px] font-medium text-primary transition-opacity hover:opacity-90"
                    >
                      Browse collection
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {wishlistItems.map((item) => (
                      <article
                        key={item.id}
                        className={`flex flex-col overflow-hidden rounded-xl border border-border-soft bg-primary ${cardShadow}`}
                      >
                        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-bg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWishlistItem(item.id)}
                            aria-label={`Remove ${item.name} from wishlist`}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path
                                d="M5 5l10 10M15 5L5 15"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[14px] font-semibold leading-snug text-text-main line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="shrink-0 text-[16px] font-semibold text-text-main">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-[12px] uppercase tracking-[0.6px] text-text-muted">
                            {item.category}
                          </p>
                          <div className="mt-auto flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleAddWishlistItemToCart(item.id);
                                openCart();
                              }}
                              className="flex-1 rounded-full bg-text-main py-2.5 text-[12px] font-semibold uppercase tracking-[0.6px] text-primary transition-opacity hover:opacity-90 active:scale-[0.98] cursor-pointer"
                            >
                              Add to Cart
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveWishlistItem(item.id)}
                              className="rounded-full border border-border-soft px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted transition-colors hover:bg-neutral-bg hover:text-text-main cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 4. TAB: ADDRESSES */}
            {activeTab === "Addresses" && (
              <section className="flex flex-col gap-6">
                <h1 className="font-jakarta text-[28px] font-bold text-text-main tracking-tight">Shipping Address</h1>
                <div className={`rounded-xl border border-border-soft bg-primary p-6 ${cardShadow}`}>
                  <h3 className="text-[14px] font-semibold text-text-main uppercase tracking-[0.6px] mb-2">Default Address</h3>
                  <p className="text-[16px] text-text-main">{user.address || "No shipping address set yet. Please edit your profile to add an address."}</p>
                </div>
              </section>
            )}

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

function OrderCompactCard({
  order,
  getPaymentStatusBadge,
  getOrderStatusLabel,
}: {
  order: Order;
  getPaymentStatusBadge: (status: string, paymentMethod?: string) => React.ReactNode;
  getOrderStatusLabel: (status: string) => React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-border-soft bg-primary p-5 ${cardShadow} flex flex-col sm:flex-row justify-between sm:items-center gap-4`}>
      <div>
        <h4 className="font-mono text-sm font-semibold text-text-main">#{order._id.substring(order._id.length - 8)}</h4>
        <p className="text-xs text-text-muted mt-1">
          Order date: {new Date(order.createdAt).toLocaleDateString("en-US")} • Items: {order.items.reduce((s, i) => s + i.quantity, 0)}
        </p>
        <p className="text-xs font-semibold text-text-main mt-1.5">Total: ${order.totalAmount.toLocaleString()}</p>
      </div>
      <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
        {getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}
        {getOrderStatusLabel(order.orderStatus)}
      </div>
    </div>
  );
}
