/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "About Us — LUA LA",
  description:
    "Discover the story, mission, and philosophy behind LUA LA — craft garments that bring ease and grace to every wardrobe.",
};

// ── Custom SVG Icons for the philosophy section ──
function RocketIcon({ className }: { className?: string }) {
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
        d="M15.59 14.37a6 6 0 0 1-5.84 0M12 11.25v8.25m0-8.25L10.5 9.75M12 11.25l1.5-1.5M8.25 18a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
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
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function HandshakeIcon({ className }: { className?: string }) {
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
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafaf5] flex flex-col justify-between">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 sm:px-16 pt-8 pb-16 flex flex-col gap-24">
        {/* ── Hero Section ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-gradient-to-br from-white to-[#f6d9d9]/10 p-8 sm:p-12 rounded-[32px] border border-[#e8e8e3]/40 shadow-[0px_4px_24px_rgba(111,89,89,0.02)]">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h1 className="font-jakarta text-[40px] sm:text-[48px] font-bold tracking-tight text-[#1a1c19] leading-[1.1]">
              About Our Brand
            </h1>
            <p className="text-[#444748] text-lg leading-[1.6] max-w-[480px]">
              We create soft, elegant, and comfortable fashion for every generation.
              Experience the gentle touch of premium materials designed for everyday moments.
            </p>
            <div>
              <a
                href="#our-story"
                className="inline-flex items-center justify-center bg-accent text-white text-[14px] font-medium tracking-[0.14px] px-8 py-4 rounded-full shadow-[0px_1px_2px_0px_rgba(111,89,89,0.25)] hover:bg-accent-hover active:scale-[0.98] transition-all cursor-pointer"
              >
                Explore Our Story
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 h-[400px] sm:h-[500px] lg:h-[550px] relative rounded-[24px] overflow-hidden shadow-[0px_8px_30px_rgba(111,89,89,0.05)]">
            <Image
              src="/about_img.webp"
              alt="LUA LA brand representation - family portrait"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center"
              quality={95}
              priority
            />
            <div className="absolute inset-0 bg-[rgba(111,89,89,0.02)]" />
          </div>
        </section>

        {/* ── Our Story Section ── */}
        <section id="our-story" className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center scroll-mt-24">
          <div className="relative rounded-[24px] overflow-hidden shadow-[0px_6px_24px_rgba(111,89,89,0.04)] h-[350px] sm:h-[450px] lg:h-[500px]">
            <Image
              src="/contact_img.webp"
              alt="Minimalist indoor space style"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center"
              quality={95}
            />
            <div className="absolute inset-0 bg-[rgba(111,89,89,0.02)]" />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="font-jakarta text-[32px] sm:text-[36px] font-bold text-[#1a1c19]">
                Our Story
              </h2>
              <div className="w-12 h-[3.5px] bg-[#f6d9d9] rounded-full" />
            </div>
            <div className="flex flex-col gap-4 text-[#444748] text-base leading-[1.6]">
              <p>
                Born from a desire for effortless style, LUA LA was founded on the principle that
                fashion should feel as good as it looks. We believe in creating pieces that
                seamlessly integrate into the rhythms of daily life, offering a sanctuary of
                comfort without sacrificing elegance.
              </p>
              <p>
                Our journey began with a simple sketch and a commitment to sourcing the softest,
                most breathable fabrics. Today, we dress families—women, men, and children—in
                timeless designs that celebrate life's beautiful, everyday moments.
              </p>
            </div>
          </div>
        </section>

        {/* ── Core Philosophy Section ── */}
        <section className="flex flex-col gap-12 bg-white/40 p-8 sm:p-12 rounded-[32px] border border-[#e8e8e3]/30 shadow-[0px_4px_20px_rgba(111,89,89,0.01)]">
          <div className="text-center">
            <h2 className="font-jakarta text-[32px] font-bold text-[#1a1c19]">
              Our Core Philosophy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Mission */}
            <div className="bg-white rounded-[20px] p-8 shadow-[0px_4px_24px_rgba(111,89,89,0.02)] border border-[#e8e8e3]/40 flex flex-col items-center text-center gap-4 hover:shadow-[0px_8px_32px_rgba(111,89,89,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-[#f6d9d9]/60 flex items-center justify-center text-[#6f5959]">
                <RocketIcon className="w-7 h-7" />
              </div>
              <h3 className="font-jakarta text-xl font-semibold text-[#1a1c19]">
                Our Mission
              </h3>
              <p className="text-[#444748] text-[15px] leading-[1.6]">
                To craft garments that bring ease and grace to every wardrobe, ensuring everyone
                feels their best, naturally.
              </p>
            </div>

            {/* Card 2: Vision */}
            <div className="bg-white rounded-[20px] p-8 shadow-[0px_4px_24px_rgba(111,89,89,0.02)] border border-[#e8e8e3]/40 flex flex-col items-center text-center gap-4 hover:shadow-[0px_8px_32px_rgba(111,89,89,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-[#e1e1f5]/70 flex items-center justify-center text-[#5c5d6e]">
                <EyeIcon className="w-7 h-7" />
              </div>
              <h3 className="font-jakarta text-xl font-semibold text-[#1a1c19]">
                Our Vision
              </h3>
              <p className="text-[#444748] text-[15px] leading-[1.6]">
                To be the trusted destination for families seeking enduring style and
                uncompromising comfort across generations.
              </p>
            </div>

            {/* Card 3: Promise */}
            <div className="bg-white rounded-[20px] p-8 shadow-[0px_4px_24px_rgba(111,89,89,0.02)] border border-[#e8e8e3]/40 flex flex-col items-center text-center gap-4 hover:shadow-[0px_8px_32px_rgba(111,89,89,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-[#e8e8e3]/80 flex items-center justify-center text-[#5d5f5f]">
                <HandshakeIcon className="w-7 h-7" />
              </div>
              <h3 className="font-jakarta text-xl font-semibold text-[#1a1c19]">
                Our Promise
              </h3>
              <p className="text-[#444748] text-[15px] leading-[1.6]">
                We are dedicated to ethical practices, premium quality, and creating pieces
                that stand the test of time.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
