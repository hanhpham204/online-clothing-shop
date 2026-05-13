'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Product, Category } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FiShoppingBag, FiArrowRight, FiStar } from 'react-icons/fi';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products/featured'),
        api.get('/categories'),
      ]);
      setFeaturedProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content animate-in">
          <span className="hero-badge">✦ NEW COLLECTION 2024</span>
          <h1>Khám Phá Phong Cách<br />Thời Trang Đỉnh Cao</h1>
          <p>
            Bộ sưu tập mới nhất với chất liệu cao cấp, thiết kế tinh tế.
            Tự tin tỏa sáng mỗi ngày cùng VogueStore.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/products">
              <button className="btn btn-primary btn-lg">
                Mua sắm ngay <FiArrowRight />
              </button>
            </Link>
            <Link href="/products?featured=true">
              <button className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                Xem BST mới
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-header">
          <h2>Danh Mục Sản Phẩm</h2>
          <p>Khám phá đa dạng danh mục thời trang</p>
        </div>
        <div className="categories-bar" style={{ justifyContent: 'center' }}>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`}>
              <span className="category-chip">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="section-header">
          <h2>Sản Phẩm Nổi Bật</h2>
          <p>Những sản phẩm được yêu thích nhất</p>
        </div>

        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4].map((i) => (
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
        ) : (
          <div className="product-grid">
            {featuredProducts.map((product, i) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="product-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="product-card-image">
                    {product.images?.[0]?.imageUrl ? (
                      <img src={resolveImageUrl(product.images[0].imageUrl)} alt={product.name} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3rem', color: '#ccc'
                      }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#f59e0b', fontSize: '0.85rem' }}>
                        <FiStar fill="#f59e0b" /> {product.avgRating.toFixed(1)} ({product.reviewCount})
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/products">
            <button className="btn btn-outline btn-lg">
              Xem tất cả sản phẩm <FiArrowRight />
            </button>
          </Link>
        </div>
      </section>

      {/* USP Section */}
      <section style={{ background: 'var(--color-bg-secondary)', padding: '4rem 0' }}>
        <div className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 500.000đ' },
              { icon: '🔄', title: 'Đổi trả 30 ngày', desc: 'Hoàn tiền nếu không hài lòng' },
              { icon: '💎', title: 'Chất lượng cao cấp', desc: 'Chất liệu tuyển chọn kỹ càng' },
              { icon: '🔒', title: 'Thanh toán an toàn', desc: 'Bảo mật thông tin 100%' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
