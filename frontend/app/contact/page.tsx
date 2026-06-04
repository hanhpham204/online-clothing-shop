"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ── Custom SVG Icons ──
function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 2.018a12.063 12.063 0 0 1-7.157-7.157l2.018-1.514c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
    </svg>
  );
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill in all required fields.");
      return;
    }

    setStatus("sending");

    // Simulate API Submission
    setTimeout(() => {
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
      });

      // Reset back to idle state after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fafaf5] flex flex-col justify-between">
      <Header />

      <main className="flex-grow pt-28">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden bg-[#fafaf5] py-16 lg:py-24">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-16 grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10 flex flex-col gap-6">
              <h1 className="font-jakarta text-[40px] sm:text-[48px] font-bold tracking-tight text-[#1a1c19] leading-[1.1]">
                Contact Us
              </h1>
              <p className="text-[#444748] text-lg leading-[1.6] max-w-[480px]">
                Have a question? Send us a message or chat with us directly on Facebook. We're here
                to help you find your perfect fit.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-[#f6d9d9] text-[#735d5e] rounded-full font-sans text-xs font-semibold uppercase tracking-wider">
                  Order Support
                </span>
                <span className="px-4 py-2 bg-[#e1e1f5] text-[#5c5d6e] rounded-full font-sans text-xs font-semibold uppercase tracking-wider">
                  Shipping
                </span>
                <span className="px-4 py-2 bg-[#e3e3de] text-[#444748] rounded-full font-sans text-xs font-semibold uppercase tracking-wider">
                  Returns
                </span>
                <span className="px-4 py-2 bg-[#f9dcdc] text-[#564242] rounded-full font-sans text-xs font-semibold uppercase tracking-wider">
                  Sizing
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square relative rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] border-8 border-white/50">
                <Image
                  alt="LUA LA Contact Hero"
                  src="/contact_img.webp"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur-xl p-6 rounded-xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] hidden md:block">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-[#6f5959] mb-1">
                  Average Response
                </p>
                <p className="font-jakarta text-2xl font-semibold text-[#1a1c19]">Under 2 Hours</p>
              </div>
            </div>
          </div>
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#f6d9d9]/20 to-transparent pointer-events-none" />
        </section>

        {/* ── Contact Options ── */}
        <section className="py-20 max-w-[1440px] mx-auto px-6 sm:px-16">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Email Card */}
            <div className="bg-white p-10 rounded-2xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] border border-[#e8e8e3]/40 hover:border-[#6f5959]/30 transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#f6d9d9] rounded-xl flex items-center justify-center text-[#6f5959] mb-8 group-hover:scale-110 transition-transform duration-300">
                <MailIcon className="w-8 h-8" />
              </div>
              <h3 className="font-jakarta text-2xl font-semibold text-[#1a1c19] mb-4">
                Send Us an Email
              </h3>
              <p className="text-[#444748] text-base leading-[1.6] mb-8">
                Preferred for formal inquiries, wholesale opportunities, or detailed order support.
              </p>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=lualastore.support@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-accent text-white text-center rounded-lg font-sans text-sm font-semibold uppercase tracking-wider hover:bg-accent-hover active:scale-[0.98] transition-all duration-300"
              >
                Send Email
              </a>
            </div>

            {/* Messenger Card */}
            <div className="bg-white p-10 rounded-2xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] border border-[#e8e8e3]/40 hover:border-[#6f5959]/30 transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#e1e1f5] rounded-xl flex items-center justify-center text-[#5c5d6e] mb-8 group-hover:scale-110 transition-transform duration-300">
                <ChatIcon className="w-8 h-8" />
              </div>
              <h3 className="font-jakarta text-2xl font-semibold text-[#1a1c19] mb-4">
                Chat on Facebook
              </h3>
              <p className="text-[#444748] text-base leading-[1.6] mb-8">
                Get instant answers about product availability, styling advice, or quick updates.
              </p>
              <a
                href="https://www.facebook.com/share/1cUXFBdQ9t/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 border border-[#9a4f5b] text-[#9a4f5b] rounded-lg font-sans text-sm font-semibold uppercase tracking-wider text-center active:scale-[0.98] transition-all hover:bg-[#9a4f5b]/5 duration-300"
              >
                Message Fanpage
              </a>
            </div>
          </div>
        </section>

        {/* ── Form & Info Section ── */}
        <section className="py-20 bg-[#f4f4ef]">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-16 grid lg:grid-cols-12 gap-16">
            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)]">
                <h2 className="font-jakarta text-[32px] font-bold text-[#1a1c19] mb-8">Write to us</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 flex flex-col">
                      <label className="font-sans text-sm font-semibold text-[#444748] ml-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 bg-[#fafaf5] rounded-xl border border-transparent focus:border-[#6f5959]/20 focus:ring-2 focus:ring-[#6f5959]/10 focus:bg-white transition-all text-[#1a1c19] placeholder:text-[#c4c7c8] outline-none"
                        placeholder="Jane Doe"
                        type="text"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col">
                      <label className="font-sans text-sm font-semibold text-[#444748] ml-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 bg-[#fafaf5] rounded-xl border border-transparent focus:border-[#6f5959]/20 focus:ring-2 focus:ring-[#6f5959]/10 focus:bg-white transition-all text-[#1a1c19] placeholder:text-[#c4c7c8] outline-none"
                        placeholder="jane@example.com"
                        type="email"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 flex flex-col">
                      <label className="font-sans text-sm font-semibold text-[#444748] ml-1">
                        Phone Number
                      </label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#fafaf5] rounded-xl border border-transparent focus:border-[#6f5959]/20 focus:ring-2 focus:ring-[#6f5959]/10 focus:bg-white transition-all text-[#1a1c19] placeholder:text-[#c4c7c8] outline-none"
                        placeholder="+84 123 456 789"
                        type="tel"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col">
                      <label className="font-sans text-sm font-semibold text-[#444748] ml-1">
                        Subject
                      </label>
                      <div className="relative">
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-[#fafaf5] rounded-xl border border-transparent focus:border-[#6f5959]/20 focus:ring-2 focus:ring-[#6f5959]/10 focus:bg-white transition-all text-[#1a1c19] outline-none appearance-none cursor-pointer"
                        >
                          <option>General Inquiry</option>
                          <option>Order Tracking</option>
                          <option>Return Request</option>
                          <option>Wholesale</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none text-[#444748]">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <label className="font-sans text-sm font-semibold text-[#444748] ml-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 bg-[#fafaf5] rounded-xl border border-transparent focus:border-[#6f5959]/20 focus:ring-2 focus:ring-[#6f5959]/10 focus:bg-white transition-all text-[#1a1c19] placeholder:text-[#c4c7c8] resize-none outline-none"
                      placeholder="How can we help you?"
                      rows={5}
                    />
                  </div>
                  <button
                    className={`px-12 py-4 text-white rounded-full font-sans text-sm font-semibold uppercase tracking-widest active:scale-95 transition-all duration-300 ${
                      status === "sending"
                        ? "bg-[#5c5d6e] cursor-not-allowed"
                        : status === "success"
                        ? "bg-[#735d5e]"
                        : "bg-accent hover:bg-accent-hover hover:shadow-lg hover:shadow-[#9a4f5b]/20"
                    }`}
                    type="submit"
                    disabled={status === "sending"}
                  >
                    {status === "sending"
                      ? "Sending..."
                      : status === "success"
                      ? "Message Sent!"
                      : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
            {/* Info Cards */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Messenger Specific Card */}
              <div className="bg-[#f6d9d9] p-8 rounded-2xl text-[#735d5e] flex flex-col gap-6">
                <div>
                  <h4 className="font-jakarta text-2xl font-semibold mb-2">Need a faster reply?</h4>
                  <p className="text-base opacity-80 leading-[1.6]">
                    Our social team is online and ready to chat right now.
                  </p>
                </div>
                <div>
                  <a
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#9a4f5b] rounded-full font-sans text-sm font-semibold active:scale-95 transition-transform shadow-[0_4px_12px_rgba(111,89,89,0.04)]"
                    href="https://www.facebook.com/share/1cUXFBdQ9t/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FacebookIcon className="w-5 h-5" />
                    Message Us on Facebook
                  </a>
                </div>
              </div>

              {/* Grid of Detail Cards */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] border border-[#e8e8e3]/40 flex flex-col gap-3">
                  <MailIcon className="w-6 h-6 text-[#9a4f5b]" />
                  <div>
                    <h5 className="font-sans text-xs font-semibold uppercase tracking-widest text-[#444748] mb-1">
                      Email Support
                    </h5>
                    <p className="font-sans text-sm text-[#1a1c19] break-words">lualastore.support@gmail.com</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] border border-[#e8e8e3]/40 flex flex-col gap-3">
                  <FacebookIcon className="w-6 h-6 text-[#9a4f5b]" />
                  <div>
                    <h5 className="font-sans text-xs font-semibold uppercase tracking-widest text-[#444748] mb-1">
                      Facebook
                    </h5>
                    <p className="font-sans text-sm text-[#1a1c19]">@luala.official</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] border border-[#e8e8e3]/40 flex flex-col gap-3">
                  <PhoneIcon className="w-6 h-6 text-[#9a4f5b]" />
                  <div>
                    <h5 className="font-sans text-xs font-semibold uppercase tracking-widest text-[#444748] mb-1">
                      Phone
                    </h5>
                    <p className="font-sans text-sm text-[#1a1c19]">+84 123 456 789</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-[0_10px_30px_-10px_rgba(111,89,89,0.05)] border border-[#e8e8e3]/40 flex flex-col gap-3">
                  <ClockIcon className="w-6 h-6 text-[#9a4f5b]" />
                  <div>
                    <h5 className="font-sans text-xs font-semibold uppercase tracking-widest text-[#444748] mb-1">
                      Working Hours
                    </h5>
                    <p className="font-sans text-sm text-[#1a1c19]">Mon - Sat, 9am - 6pm</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
