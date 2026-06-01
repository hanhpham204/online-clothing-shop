"use client";

/* eslint-disable @next/next/no-img-element */
import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../components/CartProvider";
import { useWishlist } from "../components/WishlistProvider";
import { toast } from "sonner";

// Định nghĩa kiểu dữ liệu của API
type APIProduct = {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  date: number;
  bestseller: boolean;
};

type Badge = { label: string; tone: "tertiary" | "surface" };

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  badge?: Badge;
};

const filters = [
  { label: "All", value: "all" },
  { label: "Women", value: "Women" },
  { label: "Men", value: "Men" },
  { label: "Kids", value: "Kids" },
  { label: "New Arrivals", value: "new" },
  { label: "Best Sellers", value: "bestseller" },
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

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="19" viewBox="0 0 20 19" fill="none" aria-hidden="true">
      <path
        d="M10 16.5l-1.3-1.18C4.1 11.18 1.25 8.6 1.25 5.44 1.25 3.06 3.12 1.25 5.5 1.25c1.34 0 2.63.62 3.5 1.62.87-1 2.16-1.62 3.5-1.62 2.38 0 4.25 1.81 4.25 4.19 0 3.16-2.85 5.74-7.45 9.88L10 16.5z"
        stroke={filled ? "#e11d48" : "#1c1c1c"}
        fill={filled ? "#e11d48" : "none"}
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
  const { addItem } = useCart();
  const { has: isInWishlist, toggle: toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const numericPrice = (() => {
    const parsed = parseFloat(product.price.replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  })();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      category: product.category,
      price: numericPrice,
      image: product.image,
    });
    toast.success(`Added "${product.name}" to cart!`);
  };

  const handleToggleWishlist = () => {
    const nowSaved = toggleWishlist({
      id: product.id,
      name: product.name,
      category: product.category,
      price: numericPrice,
      image: product.image,
    });
    if (nowSaved) {
      toast.success(`Saved "${product.name}" to your wishlist`);
    } else {
      toast(`Removed "${product.name}" from your wishlist`);
    }
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-primary shadow-[0px_10px_40px_-10px_rgba(111,89,89,0.08)] transition-shadow hover:shadow-[0px_18px_50px_-12px_rgba(111,89,89,0.18)]">
      {/* Wishlist */}
      <button
        type="button"
        onClick={handleToggleWishlist}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={inWishlist}
        className={`absolute right-4 top-4 z-10 flex items-center justify-center rounded-full p-2 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${
          inWishlist
            ? "bg-rose-50/90 ring-1 ring-rose-200"
            : "bg-neutral-bg/80 hover:bg-neutral-bg"
        }`}
      >
        <HeartIcon filled={inWishlist} />
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

      {/* Clickable Area */}
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1">
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
            <h3 className="min-h-[40px] text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-text-main hover:text-accent transition-colors">
              {product.name}
            </h3>
            <p className="shrink-0 text-[18px] text-text-main font-jakarta">
              {product.price}
            </p>
          </div>

          <p className="mt-1 text-[14px] text-text-muted">{product.category}</p>

          <div className="mb-6 mt-3 flex items-center gap-1">
            <StarRating rating={product.rating} idBase={product.id} />
            <span className="text-[12px] text-text-muted">({product.reviews})</span>
          </div>
        </div>
      </Link>

      {/* Add to Cart - kept outside Link so clicking it doesn't trigger navigation */}
      <div className="px-5 pb-5 mt-auto">
        <button
          onClick={handleAddToCart}
          className="w-full rounded-full bg-accent py-3 text-[14px] font-medium uppercase tracking-[0.7px] text-white transition-all hover:bg-accent-hover active:scale-[0.98] cursor-pointer"
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}

const VALID_FILTER_VALUES = new Set(filters.map((f) => f.value));

function normalizeFilterParam(raw: string | null): string {
  if (!raw) return "all";
  // Accept case-insensitive Women/Men/Kids too, since header links use the
  // capitalized form and a user might type lowercase manually.
  const candidates = [raw, raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()];
  for (const candidate of candidates) {
    if (VALID_FILTER_VALUES.has(candidate)) return candidate;
  }
  return "all";
}

function CollectionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = normalizeFilterParam(searchParams.get("category"));

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Keep the filter in sync when the URL changes (back/forward, or header
  // clicks on Women/Men/Kids while already on this page).
  useEffect(() => {
    const next = normalizeFilterParam(searchParams.get("category"));
    setActiveFilter((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const handleSelectFilter = useCallback(
    (value: string) => {
      setActiveFilter(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("category");
      } else {
        params.set("category", value);
      }
      const query = params.toString();
      router.replace(query ? `/collections?${query}` : "/collections", { scroll: false });
    },
    [router, searchParams],
  );

  // Debounce search query by 3s to avoid hammering the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Đặt giới hạn mỗi trang là 8 sản phẩm cho giao diện
  const LIMIT = 8;

  const fetchProducts = useCallback(async (isLoadMore = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const currentPage = isLoadMore ? page + 1 : 1;
      
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", LIMIT.toString());

      // Xử lý Category filter
      if (activeFilter === "Women" || activeFilter === "Men" || activeFilter === "Kids") {
        queryParams.append("category", activeFilter);
      } else if (activeFilter === "bestseller") {
        queryParams.append("bestseller", "true");
      }

      // Xử lý Sắp xếp
      // Nếu bộ lọc chọn "New Arrivals" thì ưu tiên sắp xếp mới nhất
      if (activeFilter === "new") {
        queryParams.append("sort", "newest");
      } else {
        if (sortBy === "newest") {
          queryParams.append("sort", "newest");
        } else if (sortBy === "price-asc") {
          queryParams.append("sort", "price-asc");
        } else if (sortBy === "price-desc") {
          queryParams.append("sort", "price-desc");
        }
      }

      // Xử lý Tìm kiếm với debouncedSearchQuery
      if (debouncedSearchQuery.trim() !== "") {
        queryParams.append("search", debouncedSearchQuery.trim());
      }

      const response = await fetch(`/api/products?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const resData = await response.json();
      const apiProducts: APIProduct[] = resData.data || [];
      const pagination = resData.pagination || { totalPages: 1 };

      // Chuyển đổi dữ liệu API sang kiểu hiển thị của Component
      const mappedProducts: Product[] = apiProducts.map((p) => {
        // Hàm hash để tạo số rating và reviews giả lập ổn định
        const charCodeSum = p.name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const rating = 4 + (charCodeSum % 3) * 0.5; // các giá trị 4.0, 4.5, 5.0
        const reviews = 5 + (charCodeSum % 95); // các giá trị từ 5 đến 100

        // Badge label
        let badge: Badge | undefined = undefined;
        if (p.bestseller) {
          badge = { label: "BEST SELLER", tone: "surface" };
        } else if (p.date && Date.now() - p.date < 60 * 24 * 60 * 60 * 1000) { // trong vòng 60 ngày
          badge = { label: "NEW", tone: "tertiary" };
        }

        return {
          id: p._id,
          name: p.name,
          category: p.category,
          price: `$${p.price.toFixed(2)}`,
          rating,
          reviews,
          image: p.image && p.image.length > 0 ? p.image[0] : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=500&q=80",
          badge,
        };
      });

      if (isLoadMore) {
        setProducts((prev) => [...prev, ...mappedProducts]);
        setPage(currentPage);
      } else {
        setProducts(mappedProducts);
        setPage(1);
      }

      setHasMore(currentPage < pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, sortBy, debouncedSearchQuery, page]);

  // Fetch lại từ đầu khi filter, sort, hoặc debouncedSearchQuery thay đổi
  useEffect(() => {
    fetchProducts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, sortBy, debouncedSearchQuery]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(true);
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <Header promo="New Season Collection — Fresh styles for the whole family." />

      {/* ── Main Content ── */}
      <main className="mx-auto flex max-w-[1440px] flex-col gap-12 px-6 md:px-16 pb-20 pt-8 md:pt-16">
        {/* Page header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-jakarta text-[32px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.96px] text-text-main">
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
                onClick={() => handleSelectFilter(filter.value)}
                className={`rounded-full px-6 py-[9px] text-[14px] font-medium tracking-[0.14px] transition-colors cursor-pointer ${
                  activeFilter === filter.value
                    ? "bg-tertiary text-[#191b29]"
                    : "bg-neutral-bg text-text-main hover:bg-[#e8e8e3]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection..."
                className="w-full sm:w-[256px] rounded-full bg-neutral-bg py-3 pl-12 pr-4 text-[16px] text-text-main placeholder:text-[#c4c7c8] focus:bg-primary focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            {/* Sort */}
            <div className="relative w-full sm:w-auto">
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-full border border-border-soft bg-primary py-[11px] pl-4 pr-12 text-[14px] font-medium tracking-[0.14px] text-text-main focus:outline-none focus:ring-1 focus:ring-secondary"
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
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[18px] text-text-muted">No products found in this collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="rounded-full border border-accent px-8 py-[13px] text-[14px] font-medium uppercase tracking-[0.7px] text-accent transition-all hover:bg-accent hover:text-white active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function CollectionsFallback() {
  return (
    <div className="min-h-screen bg-primary">
      <Header promo="New Season Collection — Fresh styles for the whole family." />
      <main className="mx-auto flex max-w-[1440px] flex-col items-center justify-center px-16 py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </main>
      <Footer />
    </div>
  );
}

export default function CollectionsPage() {
  // useSearchParams() requires a Suspense boundary in the App Router so the
  // page stays statically renderable; the inner component reads the URL.
  return (
    <Suspense fallback={<CollectionsFallback />}>
      <CollectionsPageContent />
    </Suspense>
  );
}
