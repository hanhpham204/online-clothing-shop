"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useCart } from "../../components/CartProvider";
import { useWishlist } from "../../components/WishlistProvider";
import { toast } from "sonner";

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

// UI Icons
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
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId}>
          <stop offset={`${fill * 100}%`} stopColor="#9a4f5b" />
          <stop offset={`${fill * 100}%`} stopColor="#e5e5e0" />
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
    <svg width="22" height="21" viewBox="0 0 20 19" fill="none" aria-hidden="true">
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

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M15.833 10H4.167M10 15.833L4.167 10 10 4.167"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RelatedProductCard({ product }: { product: any }) {
  const numericPrice = product.price;
  const image = product.image && product.image.length > 0 ? product.image[0] : "";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-primary shadow-[0px_10px_40px_-10px_rgba(111,89,89,0.08)] transition-all hover:shadow-[0px_18px_50px_-12px_rgba(111,89,89,0.18)] hover:-translate-y-0.5 duration-300">
      <Link href={`/product/${product._id}`} className="flex flex-col flex-1">
        <div className="flex h-[320px] w-full items-center justify-center overflow-hidden bg-neutral-bg">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-5 bg-white">
          <h4 className="min-h-[40px] text-[14px] font-medium leading-[1.4] text-text-main group-hover:text-accent transition-colors line-clamp-2">
            {product.name}
          </h4>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[16px] text-text-main font-semibold font-jakarta">
              ${numericPrice.toFixed(2)}
            </p>
            <p className="text-[12px] text-text-muted uppercase tracking-wider">{product.category}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { addItem } = useCart();
  const { has: isInWishlist, toggle: toggleWishlist } = useWishlist();

  // States
  const [product, setProduct] = useState<APIProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "care" | "shipping">("details");
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Fetch product detail
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch product details");
        }
        const data: APIProduct = await response.json();
        setProduct(data);
        setActiveImageIndex(0);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (err: any) {
        setError(err.message || "Product not found or network error.");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  // Fetch related products
  useEffect(() => {
    if (!product) return;
    const currentCategory = product.category;
    const currentId = product._id;
    async function loadRelated() {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("category", currentCategory);
        queryParams.append("limit", "10"); // Fetch more to filter out current
        const response = await fetch(`/api/products?${queryParams.toString()}`);
        if (response.ok) {
          const resData = await response.json();
          const filtered = (resData.data || [])
            .filter((p: any) => p._id !== currentId)
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (err) {
        console.error("Failed to load related products:", err);
      }
    }
    loadRelated();
  }, [product]);

  // Actions
  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image && product.image.length > 0 ? product.image[0] : "",
      size: selectedSize,
      qty: quantity,
    });
    toast.success(`Added ${quantity} × "${product.name}" (Size: ${selectedSize}) to cart!`);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const nowSaved = toggleWishlist({
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image && product.image.length > 0 ? product.image[0] : "",
    });
    if (nowSaved) {
      toast.success(`Saved "${product.name}" to your wishlist`);
    } else {
      toast(`Removed "${product.name}" from your wishlist`);
    }
  };

  // Mock rating scores stable to the product name
  const ratingDetails = product
    ? (() => {
        const charCodeSum = product.name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const rating = 4 + (charCodeSum % 3) * 0.5;
        const reviews = 5 + (charCodeSum % 95);
        return { rating, reviews };
      })()
    : { rating: 5, reviews: 0 };

  const isSaved = product ? isInWishlist(product._id) : false;

  return (
    <div className="min-h-screen bg-[#fafaf5] flex flex-col">
      <Header />

      <main className="flex-1 pt-8 pb-20 px-6 sm:px-16 max-w-[1280px] mx-auto w-full">
        {/* Navigation / Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-main transition-colors text-sm font-medium"
          >
            <ArrowLeftIcon />
            <span>Back to Collections</span>
          </Link>

          {product && (
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <Link href="/" className="hover:text-text-main transition-colors">Home</Link>
              <span>/</span>
              <Link href="/collections" className="hover:text-text-main transition-colors">Collections</Link>
              <span>/</span>
              <Link href={`/collections?category=${product.category}`} className="hover:text-text-main transition-colors">
                {product.category}
              </Link>
              <span>/</span>
              <span className="text-text-main max-w-[150px] truncate">{product.name}</span>
            </nav>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent mb-4"></div>
            <p className="text-text-muted">Loading product details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-rose-50 text-rose-800 rounded-2xl p-8 max-w-md border border-rose-100">
              <h2 className="text-xl font-bold mb-2">Failed to load product</h2>
              <p className="text-sm text-rose-700/80 mb-6">{error}</p>
              <Link
                href="/collections"
                className="inline-block bg-accent text-white px-6 py-3 rounded-full hover:bg-accent-hover active:scale-[0.98] transition-all text-sm font-medium uppercase tracking-wider"
              >
                Back to Shop
              </Link>
            </div>
          </div>
        )}

        {/* Product Details Grid */}
        {product && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN: Gallery */}
            <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-4 max-w-[500px] w-full mx-auto md:mx-0">
              <div className="relative w-full aspect-[3/4] rounded-[24px] overflow-hidden bg-neutral-bg shadow-[0px_8px_30px_rgba(111,89,89,0.04)] group">
                <img
                  src={product.image && product.image.length > 0 ? product.image[activeImageIndex] : ""}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {product.bestseller && (
                  <span className="absolute top-4 left-4 bg-accent text-white rounded-full px-4 py-1 text-xs font-semibold tracking-wider uppercase z-20">
                    Best Seller
                  </span>
                )}

                {/* Left/Right navigation arrows */}
                {product.image && product.image.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? product.image.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-text-main flex items-center justify-center shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === product.image.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-text-main flex items-center justify-center shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              {product.image && product.image.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {product.image.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-24 rounded-xl overflow-hidden bg-neutral-bg border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? "border-accent ring-2 ring-accent/15"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Info & Buy Options */}
            <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-start">
              {/* Category / Sub */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-semibold text-accent uppercase tracking-[1.5px]">
                  {product.category}
                </span>
                <span className="text-text-muted">•</span>
                <span className="text-[12px] font-medium text-text-muted uppercase tracking-[1px]">
                  {product.subCategory}
                </span>
              </div>

              <h1 className="font-jakarta text-[32px] font-bold text-text-main leading-tight mb-2 tracking-tight">
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mb-6">
                <StarRating rating={ratingDetails.rating} idBase={product._id} />
                <span className="text-xs text-text-muted font-medium">
                  {ratingDetails.rating.toFixed(1)} / 5.0 ({ratingDetails.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <p className="text-3xl text-text-main font-bold font-jakarta mb-6">
                ${product.price.toFixed(2)}
              </p>

              {/* Short description */}
              <p className="text-text-muted leading-relaxed mb-8 text-[15px]">
                {product.description || "Crafted with clean lines and premium fabric, this versatile piece adds effortless style and premium comfort to your daily closet."}
              </p>

              <hr className="border-border-soft mb-6" />

              {/* SIZE SELECTION */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-text-main uppercase tracking-wider">
                      Select Size
                    </span>
                    <button className="text-xs text-accent underline hover:text-accent-hover transition-colors font-medium">
                      Size Guide
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[50px] h-[50px] rounded-full flex items-center justify-center text-sm font-semibold border transition-all cursor-pointer ${
                          selectedSize === size
                            ? "bg-accent border-accent text-white shadow-[0px_4px_12px_rgba(154,79,91,0.25)]"
                            : "bg-[#e8e8e3]/40 border-border-soft text-text-main hover:bg-[#e8e8e3] hover:border-[#c4c7c8]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUANTITY & ACTIONS */}
              <div className="mb-8">
                <span className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-3">
                  Quantity
                </span>
                
                <div className="flex items-center gap-4">
                  {/* Stepper */}
                  <div className="flex items-center rounded-full border border-border-soft bg-white p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-text-main hover:bg-neutral-bg active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <MinusIcon />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold font-jakarta text-text-main select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-text-main hover:bg-neutral-bg active:scale-95 transition-all"
                    >
                      <PlusIcon />
                    </button>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={handleToggleWishlist}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                      isSaved
                        ? "bg-rose-50 border-rose-200 text-rose-500 shadow-sm"
                        : "bg-white border-border-soft text-text-main hover:bg-neutral-bg"
                    }`}
                    aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <HeartIcon filled={isSaved} />
                  </button>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-accent hover:bg-accent-hover text-white rounded-full py-4 font-semibold uppercase tracking-[1px] text-sm shadow-[0px_4px_16px_rgba(154,79,91,0.3)] transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer mb-8"
              >
                Add to Cart
              </button>

              <hr className="border-border-soft mb-6" />

              {/* SPECIFICATION TABS */}
              <div className="space-y-4">
                <div className="flex border-b border-border-soft">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-3 px-1 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer mr-6 ${
                      activeTab === "details"
                        ? "border-accent text-accent"
                        : "border-transparent text-text-muted hover:text-text-main"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("care")}
                    className={`py-3 px-1 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer mr-6 ${
                      activeTab === "care"
                        ? "border-accent text-accent"
                        : "border-transparent text-text-muted hover:text-text-main"
                    }`}
                  >
                    Care Instructions
                  </button>
                  <button
                    onClick={() => setActiveTab("shipping")}
                    className={`py-3 px-1 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === "shipping"
                        ? "border-accent text-accent"
                        : "border-transparent text-text-muted hover:text-text-main"
                    }`}
                  >
                    Shipping & Returns
                  </button>
                </div>

                <div className="text-sm leading-relaxed text-text-muted min-h-[80px] py-1">
                  {activeTab === "details" && (
                    <div className="space-y-2">
                      <p>{product.description || "A clean silhouette designed for style, durability, and daily comfort."}</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Collection Category: {product.category}</li>
                        <li>Sub-collection: {product.subCategory}</li>
                        <li>Features: Seamless tailoring, premium stitching details</li>
                        <li>Availability: In Stock</li>
                      </ul>
                    </div>
                  )}
                  {activeTab === "care" && (
                    <p>
                      100% premium breathable cotton/blend fabric. Hand wash or machine wash cold with similar colors. Wash inside out. Dry flat or tumble dry low. Use cool iron if necessary. Do not dry clean.
                    </p>
                  )}
                  {activeTab === "shipping" && (
                    <p>
                      Free standard shipping on orders over $150. Shipping generally takes 3 to 5 business days depending on location. Fast express delivery options are available during checkout. Returns are happily accepted within 30 days of purchase, provided items are returned in original unworn condition with tags attached.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* RELATED PRODUCTS */}
        {product && relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border-soft">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-jakarta text-[24px] font-bold text-text-main tracking-tight">
                You May Also Like
              </h3>
              <Link
                href={`/collections?category=${product.category}`}
                className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-accent-hover transition-all"
              >
                View Category
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <RelatedProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
