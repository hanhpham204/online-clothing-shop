"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../components/CartProvider";
import { useAuth } from "../components/AuthProvider";
import { toast } from "sonner";
import {
  formatVnd,
  getAccountDisplayName,
  getBankDisplayInfo,
  getPaymentQrUrl,
  getVaAccountNumber,
} from "@/lib/payment-qr";

// Icons represented as clean inline SVGs
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CashIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const TransferIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-16 h-16 text-emerald-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image?: string;
}

interface OrderResponse {
  _id: string;
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paymentId?: string;
  createdAt: string;
}

interface PaymentInfo {
  paymentId: string;
  transferContent: string;
  amount: number;
  cartTotal?: number;
  vaNumber?: string;
  bankName?: string;
  qrCodeUrl?: string;
  vaHolderName?: string;
  expiredAt?: string;
  status?: string;
  orderId?: string;
  orderCreated?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  // Form states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER">("COD");

  // Order & UI states
  const [checkoutState, setCheckoutState] = useState<"input" | "bank_transfer_qr" | "success">("input");
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || "");
      setPhoneNumber(user.phone || "");
      setShippingAddress(user.address || "");
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (cartItems.length === 0 && checkoutState === "input") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4">
        <div className="text-center max-w-md p-8 bg-slate-900/60 rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-slate-800/60 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Your cart is empty</h1>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            You haven&apos;t added any items to your cart yet. Head back to the shop and pick out something you love.
          </p>
          <Link
            href="/"
            className="inline-flex w-full justify-center items-center px-6 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all shadow-lg hover:shadow-white/5 active:scale-[0.98]"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      toast.error("Please enter the recipient's full name.");
      return false;
    }
    if (!phoneNumber.trim()) {
      toast.error("Please enter the recipient's phone number.");
      return false;
    }
    const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      toast.error("Invalid phone number (must start with 0 and contain exactly 10 digits).");
      return false;
    }
    if (!shippingAddress.trim()) {
      toast.error("Please enter the shipping address.");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const customerPayload = {
      userId: user?.userId || undefined,
      email: user?.email || undefined,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      shippingAddress: shippingAddress.trim(),
      items: cartItems.map((item) => ({
        productId: item.id.split("-")[0],
        name: item.name,
        price: item.price,
        quantity: item.qty,
        size: item.size || "M",
        image: item.image,
      })),
      paymentMethod,
    };

    try {
      if (paymentMethod === "COD") {
        // COD path is unchanged — order-service creates the order directly,
        // then publishes order.created on the Redis Stream for email-service.
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerPayload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to create the order");
        }
        const responseData = await response.json();
        setCreatedOrder(responseData.order);
        clearCart();
        setCheckoutState("success");
        toast.success("Order placed successfully!");
      } else {
        // BANK_TRANSFER path: payment-service creates a checkout intent and
        // returns a QR. The actual Order is only created (in order-service)
        // AFTER the SePay webhook confirms the transfer — orchestrated via
        // Redis Streams.
        const response = await fetch("/api/payments/checkout-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerPayload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to start the bank-transfer checkout",
          );
        }
        const payment: PaymentInfo = await response.json();
        setPaymentInfo(payment);
        setCheckoutState("bank_transfer_qr");
        toast.info("Scan the QR code to complete the bank transfer.");

        startLongPollPaymentStatus(payment.paymentId);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong while placing your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    // Fetch latest payment details first to check if orderId exists
    let latestPayment: PaymentInfo | null = null;
    try {
      const response = await fetch(`/api/payments/${paymentId}`);
      if (response.ok) {
        latestPayment = await response.json();
        if (latestPayment) {
          setPaymentInfo(latestPayment);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch final payment details:", err);
    }

    const orderId = latestPayment?.orderId || paymentInfo?.orderId;
    const cartTotal = latestPayment?.cartTotal || paymentInfo?.cartTotal || subtotal;

    let resolvedOrder: OrderResponse | null = null;
    if (orderId) {
      // Try to fetch the materialized order from database (since Stream processing is async, try up to 3 times)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const orderRes = await fetch(`/api/orders/${orderId}`);
          if (orderRes.ok) {
            resolvedOrder = (await orderRes.json()) as OrderResponse;
            break;
          }
        } catch (err) {
          console.warn(`Order fetch attempt ${attempt} failed:`, err);
        }
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    if (!resolvedOrder) {
      resolvedOrder = {
        _id: orderId || "pending",
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        shippingAddress: shippingAddress.trim(),
        items: cartItems.map((item) => ({
          productId: item.id.split("-")[0],
          name: item.name,
          price: item.price,
          quantity: item.qty,
          size: item.size || "M",
          image: item.image,
        })),
        totalAmount: cartTotal,
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        paymentId: paymentId,
        createdAt: new Date().toISOString(),
      };
    }

    setCreatedOrder(resolvedOrder);
    
    // Clean up connections/intervals
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    clearCart();
    setCheckoutState("success");
    toast.success("Payment confirmed via SePay!");
  };

  const startLongPollPaymentStatus = (paymentId: string) => {
    // Clean up existing connections
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const poll = async () => {
      if (controller.signal.aborted) return;

      try {
        const response = await fetch(`/api/payment-wait/${paymentId}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        if (data.status === "COMPLETED") {
          await handlePaymentSuccess(paymentId);
        } else if (data.status === "FAILED") {
          toast.error("Thanh toán không thành công.");
          setCheckoutState("input");
        } else {
          // If status is PENDING (timeout/long-poll closed), re-trigger wait after 1 second
          fallbackTimeoutRef.current = setTimeout(poll, 1000);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Long poll aborted.");
          return;
        }
        console.error("Error in payment long-polling:", err);
        // On network error or other HTTP errors, retry after 2 seconds
        fallbackTimeoutRef.current = setTimeout(poll, 2000);
      }
    };

    poll();
  };

  const bankInfo = getBankDisplayInfo();

  const vaAccountNumber = paymentInfo ? getVaAccountNumber(paymentInfo, bankInfo) : "";
  const vietQrUrl = paymentInfo ? getPaymentQrUrl(paymentInfo, bankInfo) : "";
  const accountDisplayName = paymentInfo ? getAccountDisplayName(paymentInfo, bankInfo) : bankInfo.accountName;

  // 1. INPUT FORM STATE VIEW
  if (checkoutState === "input") {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/80">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              <BackIcon />
              <span>Back to Shop</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Checkout</h1>
            <div className="w-20"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="p-6 sm:p-8 bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
                  <h2 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 bg-white text-slate-950 text-sm rounded-full font-bold">1</span>
                    Shipping Information
                  </h2>

                  <div className="space-y-5">
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <UserIcon />
                        </div>
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phoneNumber" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <PhoneIcon />
                        </div>
                        <input
                          type="text"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0987654321"
                          className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="shippingAddress" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Shipping Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <MapPinIcon />
                        </div>
                        <input
                          type="text"
                          id="shippingAddress"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Street, Ward, District, City"
                          className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
                  <h2 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 bg-white text-slate-950 text-sm rounded-full font-bold">2</span>
                    Payment Method
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setPaymentMethod("COD")}
                      className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
                        paymentMethod === "COD"
                          ? "border-white bg-white/5"
                          : "border-slate-800 hover:border-slate-700 bg-slate-950/20"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${paymentMethod === "COD" ? "bg-white text-slate-950" : "bg-slate-900 text-slate-400"}`}>
                        <CashIcon />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Cash on Delivery</h3>
                        <p className="text-slate-400 text-xs mt-1">Pay in cash (COD) when you receive your order.</p>
                      </div>
                      {paymentMethod === "COD" && (
                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-slate-950"></div>
                        </div>
                      )}
                    </div>

                    <div
                      onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "border-white bg-white/5"
                          : "border-slate-800 hover:border-slate-700 bg-slate-950/20"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${paymentMethod === "BANK_TRANSFER" ? "bg-white text-slate-950" : "bg-slate-900 text-slate-400"}`}>
                        <TransferIcon />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Bank Transfer (VietQR / SePay)</h3>
                        <p className="text-slate-400 text-xs mt-1">Scan a QR code in your banking app. Reconciliation is automatic.</p>
                      </div>
                      {paymentMethod === "BANK_TRANSFER" && (
                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-slate-950"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 active:scale-[0.99] transition-all shadow-xl hover:shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-base flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing your order...</span>
                    </>
                  ) : (
                    <span>Place Order • ${subtotal.toLocaleString()}</span>
                  )}
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-lg font-bold tracking-tight text-white mb-4">Your Order</h2>

              <div className="divide-y divide-slate-800 max-h-[350px] overflow-y-auto pr-2 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-xs text-white line-clamp-1">{item.name}</h3>
                        <p className="text-slate-400 text-xxs mt-1 uppercase tracking-wider">{item.category} • Size: {item.size || "M"}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-400 text-xs">Qty: {item.qty}</span>
                        <span>${(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-5 space-y-3">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Shipping</span>
                  <span className="text-emerald-500 font-medium">Free</span>
                </div>
                <div className="border-t border-slate-800 pt-4 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-white">${subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. BANK TRANSFER QR VIEW (VietQR & Polling)
  if (checkoutState === "bank_transfer_qr" && paymentInfo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans antialiased py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-white/5 rounded-full blur-3xl -z-10"></div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Bank Transfer Payment</h1>
            <p className="text-slate-400 text-sm">Scan the VietQR code below to pay automatically via SePay</p>
          </div>

          <div className="bg-white p-6 rounded-2xl max-w-[280px] mx-auto shadow-2xl relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vietQrUrl} alt="VietQR payment code" className="w-full h-auto rounded-lg" />
            <div className="absolute inset-0 border-2 border-slate-950/10 rounded-2xl pointer-events-none"></div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Bank</span>
              <span className="font-semibold text-white">
                {paymentInfo?.bankName || bankInfo.bankId} {bankInfo.isVa ? "(Virtual Account)" : ""}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3.5">
              <span className="text-slate-400">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-white">{vaAccountNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(vaAccountNumber, "Account Number")}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <CopyIcon />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3.5">
              <span className="text-slate-400">Account Name</span>
              <span className="font-semibold text-white">{accountDisplayName}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3.5">
              <span className="text-slate-400">Amount</span>
              <span className="font-bold text-white">${paymentInfo.amount}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3.5">
              <span className="text-slate-400">Transfer Memo</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-xs">
                  LUALA {paymentInfo.transferContent}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(`LUALA ${paymentInfo.transferContent}`, "Transfer Memo")}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <CopyIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-400">
            <svg className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>
              <strong>Important:</strong> The system confirms your payment automatically within 1-3 minutes after the bank receives your transfer. If you transfer manually, make sure the memo is exactly <strong>LUALA {paymentInfo.transferContent}</strong>.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 py-2 text-sm text-slate-400">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Waiting for you to scan the payment code...</span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                if (socketRef.current) {
                  socketRef.current.close();
                  socketRef.current = null;
                }
                if (fallbackTimeoutRef.current) {
                  clearTimeout(fallbackTimeoutRef.current);
                  fallbackTimeoutRef.current = null;
                }
                setCheckoutState("input");
              }}
              className="flex-1 py-3 border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-900/40 text-slate-300 font-medium rounded-xl transition-all active:scale-[0.98] text-sm"
            >
              Change Payment Method
            </button>
            <Link
              href="/"
              className="flex-1 inline-flex justify-center items-center py-3 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98] text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. SUCCESS / CONGRATULATIONS VIEW
  if (checkoutState === "success" && createdOrder) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans antialiased py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>

          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckIcon />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Order Placed Successfully!</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Thank you for shopping at LUA LA. Your order has been received and is being prepared.
            </p>
          </div>

          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-6 text-left space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Order ID</span>
              <span className="font-mono font-semibold text-white">{createdOrder._id}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3">
              <span className="text-slate-400">Recipient Name</span>
              <span className="font-semibold text-white">{createdOrder.fullName}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3">
              <span className="text-slate-400">Phone Number</span>
              <span className="font-semibold text-white">{createdOrder.phoneNumber}</span>
            </div>

            <div className="flex justify-between items-start text-sm border-t border-slate-900 pt-3">
              <span className="text-slate-400 shrink-0">Shipping Address</span>
              <span className="font-semibold text-white text-right wrap-break-word max-w-[250px]">
                {createdOrder.shippingAddress}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3">
              <span className="text-slate-400">Payment Method</span>
              <span className="font-semibold text-white">
                {createdOrder.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer (SePay)"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-slate-900 pt-3">
              <span className="text-slate-400">Payment Status</span>
              <span
                className={`font-semibold px-2.5 py-0.5 rounded text-xs ${
                  createdOrder.paymentStatus === "PAID"
                    ? "text-emerald-400 bg-emerald-400/10"
                    : "text-amber-400 bg-amber-400/10"
                }`}
              >
                {createdOrder.paymentStatus === "PAID" ? "Paid" : "Awaiting Payment"}
              </span>
            </div>

            <div className="flex justify-between items-center text-base font-bold border-t border-slate-800 pt-4">
              <span className="text-white">Total</span>
              <span className="text-white">${createdOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/"
              className="flex-1 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98] text-sm inline-flex justify-center items-center shadow-lg hover:shadow-white/5"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
