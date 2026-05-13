'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Product, Category } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FiShoppingBag, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Read category from URL on mount
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, activeCategory, categories]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/all');
      setCategories(res.data.data || []);
    } catch {}
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&size=12&sortBy=createdAt&sortDir=desc`;
      if (activeCategory && categories.length > 0) {
        const cat = categories.find(c => c.slug === activeCategory);
        if (cat) url = `/products/category/${cat.id}?page=${page}&size=12`;
      }
      const res = await api.get(url);
      const data = res.data.data;
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="section">
        <div className="section-header">
          <h2>Tất Cả Sản Phẩm</h2>
          <p>Khám phá bộ sưu tập đa dạng</p>
        </div>

        {/* Categories filter */}
        <div className="categories-bar" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <span className={`category-chip ${!activeCategory ? 'active' : ''}`}
            onClick={() => { setActiveCategory(null); setPage(0); }}>Tất cả</span>
          {categories.map(cat => (
            <span key={cat.id}
              className={`category-chip ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat.slug); setPage(0); }}>
              {cat.name}
            </span>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-card">
                <div className="product-card-image skeleton" style={{ height: '320px' }} />
                <div className="product-card-body">
                  <div className="skeleton" style={{ height: '14px', width: '60px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '18px', width: '80%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '20px', width: '120px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
            <FiShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, i) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="product-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="product-card-image">
                    {product.images?.[0]?.imageUrl ? (
                      <img src={resolveImageUrl(product.images[0].imageUrl)} alt={product.name} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#ccc' }}>
                        <FiShoppingBag />
                      </div>
                    )}
                    {product.salePrice && (
                      <span className="product-card-badge">
                        -{Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-category">{product.categoryName}</div>
                    <h3 className="product-card-name">{product.name}</h3>
                    <div className="product-card-price">
                      <span className="price-current">{formatPrice(product.effectivePrice)}</span>
                      {product.salePrice && (
                        <span className="price-original">{formatPrice(product.basePrice)}</span>
                      )}
                    </div>
                    {product.avgRating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#f59e0b', fontSize: '0.85rem' }}>
                        <FiStar fill="#f59e0b" /> {product.avgRating.toFixed(1)} ({product.reviewCount})
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}>
              <FiChevronLeft />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontWeight: 600 }}>
              {page + 1} / {totalPages}
            </span>
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page>=totalPages-1}>
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
