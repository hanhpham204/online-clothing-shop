/* eslint-disable @next/next/no-img-element */
import Header from "../components/Header";
import Footer from "../components/Footer";

// Temporary Figma asset URLs for product imagery — swap with hosted/CDN images before production
const productImages = {
  dress: "https://www.figma.com/api/mcp/asset/68dbbbf5-5427-41aa-8788-0d310b0a3ba4",
  blazer: "https://www.figma.com/api/mcp/asset/473e59de-3e36-4df6-9104-060f573a126c",
  sweater: "https://www.figma.com/api/mcp/asset/3207939c-e886-462d-b455-faa1c7c29a0b",
  playsuit: "https://www.figma.com/api/mcp/asset/3a2e9d8b-d4f2-403c-ab13-d8d048a894ff",
};

type Badge = { label: string; tone: "tertiary" | "surface" };

type Product = {
  name: string;
  category: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  badge?: Badge;
};

const products: Product[] = [
  {
    name: "Draped Linen Midi Dress",
    category: "Women",
    price: "$145.00",
    rating: 5,
    reviews: 24,
    image: productImages.dress,
    badge: { label: "NEW", tone: "tertiary" },
  },
  {
    name: "Lightweight Summer Blazer",
    category: "Men",
    price: "$180.00",
    rating: 4.5,
    reviews: 12,
    image: productImages.blazer,
  },
  {
    name: "Oversized Cashmere Blend",
    category: "Women",
    price: "$210.00",
    rating: 5,
    reviews: 89,
    image: productImages.sweater,
    badge: { label: "BEST SELLER", tone: "surface" },
  },
  {
    name: "Organic Cotton Playsuit",
    category: "Kids",
    price: "$65.00",
    rating: 4,
    reviews: 34,
    image: productImages.playsuit,
  },
];

const filters = [
  { label: "All", active: false },
  { label: "Women", active: false },
  { label: "Men", active: false },
  { label: "Kids", active: false },
  { label: "New Arrivals", active: true },
  { label: "Best Sellers", active: false },
];

function StarRating({ rating, idBase }: { rating: number; idBase: string }) {
  return (
    <div className="flex items-center gap-px" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return <Star key={i} fill={fill} gradId={`${idBase}-star-${i}`} />;
      })}
    </div>
  );
}

function Star({ fill, gradId }: { fill: number; gradId: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId}>
          <stop offset={`${fill * 100}%`} stopColor="#6f5959" />
          <stop offset={`${fill * 100}%`} stopColor="#d7cccc" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79L1.58 7.62l5.82-.85L10 1.5z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="19" viewBox="0 0 20 19" fill="none" aria-hidden="true">
      <path
        d="M10 16.5l-1.3-1.18C4.1 11.18 1.25 8.6 1.25 5.44 1.25 3.06 3.12 1.25 5.5 1.25c1.34 0 2.63.62 3.5 1.62.87-1 2.16-1.62 3.5-1.62 2.38 0 4.25 1.81 4.25 4.19 0 3.16-2.85 5.74-7.45 9.88L10 16.5z"
        stroke="#1c1c1c"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.25" stroke="#555555" strokeWidth="1.5" />
      <path d="M12.5 12.5l3.75 3.75" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
      <path d="M1 1.5L6 6.5l5-5" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-primary shadow-[0px_10px_40px_-10px_rgba(111,89,89,0.08)] transition-shadow hover:shadow-[0px_18px_50px_-12px_rgba(111,89,89,0.18)]">
      {/* Wishlist */}
      <button
        aria-label="Add to wishlist"
        className="absolute right-4 top-4 z-10 flex items-center justify-center rounded-full bg-neutral-bg/80 p-2 backdrop-blur-sm transition-transform hover:scale-105"
      >
        <HeartIcon />
      </button>

      {/* Badge */}
      {product.badge && (
        <span
          className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.6px] ${
            product.badge.tone === "tertiary"
              ? "bg-tertiary text-[#191b29]"
              : "bg-[#e8e8e3] text-text-main"
          }`}
        >
          {product.badge.label}
        </span>
      )}

      {/* Image */}
      <div className="flex h-[360px] w-full items-center justify-center overflow-hidden bg-neutral-bg">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full scale-[1.05] object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-h-[40px] text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-text-main">
            {product.name}
          </h3>
          <p className="shrink-0 text-[18px] text-text-main font-jakarta">
            {product.price}
          </p>
        </div>

        <p className="mt-1 text-[14px] text-text-muted">{product.category}</p>

        <div className="mb-6 mt-3 flex items-center gap-1">
          <StarRating rating={product.rating} idBase={product.name.replace(/\s+/g, "-").toLowerCase()} />
          <span className="text-[12px] text-text-muted">({product.reviews})</span>
        </div>

        <button className="mt-auto w-full rounded-full bg-accent py-3 text-[14px] font-medium uppercase tracking-[0.7px] text-white transition-all hover:bg-accent-hover active:scale-[0.98]">
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-primary">
      <Header promo="New Season Collection — Fresh styles for the whole family." />

      {/* ── Main Content ── */}
      <main className="mx-auto flex max-w-[1440px] flex-col gap-12 px-16 pb-20 pt-16">
        {/* Page header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-jakarta text-[48px] font-bold leading-[1.1] tracking-[-0.96px] text-text-main">
            All Collections
          </h1>
          <p className="max-w-[672px] text-[18px] leading-[1.6] text-text-muted">
            Explore our latest fashion pieces for women, men, and kids.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            {filters.map((filter) => (
              <button
                key={filter.label}
                className={`rounded-full px-6 py-[9px] text-[14px] font-medium tracking-[0.14px] transition-colors ${
                  filter.active
                    ? "bg-tertiary text-[#191b29]"
                    : "bg-neutral-bg text-text-main hover:bg-[#e8e8e3]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search collection..."
                className="w-[256px] rounded-full bg-neutral-bg py-3 pl-12 pr-4 text-[16px] text-text-main placeholder:text-[#c4c7c8] focus:bg-primary focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                aria-label="Sort products"
                className="cursor-pointer appearance-none rounded-full border border-border-soft bg-primary py-[11px] pl-4 pr-12 text-[14px] font-medium tracking-[0.14px] text-text-main focus:outline-none focus:ring-1 focus:ring-secondary"
                defaultValue="featured"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <ChevronDown />
              </span>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center pt-4">
          <button className="rounded-full border border-accent px-8 py-[13px] text-[14px] font-medium uppercase tracking-[0.7px] text-accent transition-all hover:bg-accent hover:text-white active:scale-[0.98]">
            Load More
          </button>
        </div>
      </main>

      {/* ── Newsletter ── */}
      {/* <section className="bg-neutral-bg px-6 py-24">
        <div className="mx-auto flex max-w-[672px] flex-col items-center gap-4 text-center">
          <h2 className="font-jakarta text-[24px] font-semibold text-text-main">
            Join the LUA LA Collective.
          </h2>
          <p className="text-[16px] text-text-muted">
            Subscribe for early access and fashion updates.
          </p>
          <form className="mt-2 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full max-w-[384px] rounded-full bg-primary px-6 py-3.5 text-[16px] text-text-main shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] placeholder:text-[#c4c7c8] focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <button
              type="submit"
              className="rounded-full bg-text-main px-8 py-3.5 text-[14px] font-medium uppercase tracking-[0.7px] text-primary transition-colors hover:bg-[#333333] active:scale-[0.98]"
            >
              Join
            </button>
          </form>
        </div>
      </section> */}

      <Footer />
    </div>
  );
}
