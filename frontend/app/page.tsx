/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

const newSeasonIcon =
  "https://www.figma.com/api/mcp/asset/4d1edab2-87c1-486a-b0b8-f39e9d0572a2";
const premiumFabricsIcon =
  "https://www.figma.com/api/mcp/asset/6ee49868-1ff8-4128-a446-e2c794dc4998";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <Header />

      {/* ── Hero Section ── */}
      <main className="pt-8 px-6 md:px-16 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 py-6 md:py-12">
          {/* Left: Copy & CTAs */}
          <div className="col-span-1 md:col-span-5 flex flex-col gap-8 justify-center self-center">
            {/* Text block */}
            <div className="flex flex-col gap-[22.8px]">
              {/* Season badge */}
              <div className="inline-flex">
                <span className="bg-[#e3e3de] rounded-full px-4 py-[5px] text-[#444748] text-xs font-semibold tracking-[0.6px] uppercase">
                  NEW SEASON
                </span>
              </div>

              {/* Heading */}
              <h1
                className="text-[#1a1c19] text-[36px] sm:text-[48px] font-bold tracking-[-0.96px] leading-[1.1] font-jakarta"
              >
                Style for
                <br />
                Every Generation
              </h1>

              {/* Description */}
              <p className="text-[#444748] text-[18px] leading-[1.6] max-w-[448px]">
                Discover soft, elegant, and modern fashion for women, men, and
                kids — designed for comfort, confidence, and everyday charm.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/collections"
                className="bg-accent text-white text-[14px] font-medium tracking-[0.14px] px-8 py-4 rounded-full shadow-[0px_1px_2px_0px_rgba(111,89,89,0.25)] hover:bg-accent-hover active:scale-[0.98] transition-all"
              >
                Shop Now
              </Link>
              <Link
                href="/collections"
                className="border border-border-soft text-text-main text-[14px] font-medium tracking-[0.14px] px-8 py-4 rounded-full hover:bg-neutral-bg active:scale-[0.98] transition-all"
              >
                Explore Collection
              </Link>
            </div>

            {/* Value indicators */}
            <div className="pt-4">
              <div className="border-t border-[#e3e3de] pt-8 flex gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#f6d9d9] rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                    <img
                      src={newSeasonIcon}
                      alt=""
                      className="w-[16.67px] h-[15.83px]"
                    />
                  </div>
                  <div className="text-[#444748] text-[12px] font-semibold tracking-[0.6px] uppercase leading-[1.4]">
                    <p>NEW SEASON</p>
                    <p>ARRIVALS</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-[#e8e8e3] rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                    <img
                      src={premiumFabricsIcon}
                      alt=""
                      className="w-[16.67px] h-[13.33px]"
                    />
                  </div>
                  <div className="text-[#444748] text-[12px] font-semibold tracking-[0.6px] uppercase leading-[1.4]">
                    <p>PREMIUM</p>
                    <p>FABRICS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Fashion photo — stays self-stretch so it never exceeds the
              image's native size and avoids upscaling/blur */}
          <div className="col-span-1 md:col-span-7 self-stretch min-h-[350px] md:min-h-[500px] lg:max-h-[1008px] relative rounded-[32px] overflow-hidden shadow-[0px_10px_40px_-10px_rgba(111,89,89,0.05)]">
            {/* Hero image */}
            <Image
              src="/hero_img.webp"
              alt="Fashion collection — model wearing LUA LA styles"
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover object-center"
              quality={100}
              priority
            />
            {/* Soft tint overlay */}
            <div className="absolute inset-0 bg-[rgba(111,89,89,0.05)]" />

            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
