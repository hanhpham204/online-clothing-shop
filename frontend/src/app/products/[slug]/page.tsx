'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Product, ProductVariant } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiHeart, FiMinus, FiPlus, FiStar, FiTruck, FiRefreshCw, FiShield } from 'react-icons/fi';

export default function ProductDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (params.slug) fetchProduct(params.slug as string);
  }, [params.slug]);

  const fetchProduct = async (slug: string) => {
    try {
      const res = await api.get(`/products/${slug}`);
      const p = res.data.data;
      setProduct(p);
      // Auto-select first available color/size
      if (p.variants?.length > 0) {
        const colors = [...new Set(p.variants.map((v: ProductVariant) => v.color))];
        const firstColor = colors[0] as string;
        setSelectedColor(firstColor);
        const sizesForColor = p.variants.filter((v: ProductVariant) => v.color === firstColor);
        if (sizesForColor.length > 0) {
          setSelectedSize(sizesForColor[0].size);
          setSelectedVariant(sizesForColor[0]);
        }
      }
    } catch {
      toast.error('Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product && selectedColor && selectedSize) {
      const variant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
      setSelectedVariant(variant || null);
    }
  }, [selectedColor, selectedSize, product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    if (!selectedVariant) {
      toast.error('Vui lòng chọn size và màu');
      return;
    }
    try {
      await api.post('/cart/items', { variantId: selectedVariant.id, quantity });
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng');
    }
  };

  if (loading || !product) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải...</div>;
  }

  const colors = [...new Set(product.variants.map(v => v.color))];
  const sizesForColor = product.variants.filter(v => v.color === selectedColor);
  const sizes = [...new Set(sizesForColor.map(v => v.size))];

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">Vogue<span>Store</span></Link>
          <div className="header-actions">
            <Link href="/cart"><button className="btn btn-icon"><FiShoppingCart /></button></Link>
          </div>
        </div>
      </header>

      <div className="section" style={{ maxWidth: 1200 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
          {/* Image Gallery */}
          <div>
            <div style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-bg-secondary)', marginBottom: '1rem' }}>
              {product.images?.[selectedImage]?.imageUrl ? (
                <img src={resolveImageUrl(product.images[selectedImage].imageUrl)} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#ddd' }}>
                  <FiShoppingCart />
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {product.images.map((img, i) => (
                  <div key={i} onClick={() => setSelectedImage(i)}
                    style={{ width: 80, height: 100, borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer',
                      border: selectedImage === i ? '2px solid var(--color-accent)' : '2px solid transparent', background: '#f5f5f5' }}>
                    <img src={resolveImageUrl(img.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              {product.categoryName}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>{product.name}</h1>

            {/* Rating */}
            {product.avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                  {[1,2,3,4,5].map(s => <FiStar key={s} fill={s <= product.avgRating! ? '#f59e0b' : 'none'} size={18} />)}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>({product.reviewCount} đánh giá)</span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                {formatPrice(selectedVariant?.finalPrice || product.effectivePrice)}
              </span>
              {product.salePrice && (
                <>
                  <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                    {formatPrice(product.basePrice)}
                  </span>
                  <span className="price-discount">-{Math.round((1 - product.salePrice / product.basePrice) * 100)}%</span>
                </>
              )}
            </div>

            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '2rem' }}>{product.description}</p>

            {/* Color Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Màu sắc: <strong>{selectedColor}</strong></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {colors.map(color => {
                  const v = product.variants.find(v => v.color === color);
                  return (
                    <button key={color} onClick={() => { setSelectedColor(color); setSelectedSize(''); }}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: selectedColor === color ? '3px solid var(--color-accent)' : '2px solid var(--color-border)',
                        background: v?.colorCode || '#ddd', cursor: 'pointer', transition: 'all 0.2s' }}
                      title={color} />
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Kích thước</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {sizes.map(size => {
                  const v = product.variants.find(v => v.color === selectedColor && v.size === size);
                  const outOfStock = !v || v.stockQuantity <= 0;
                  return (
                    <button key={size} onClick={() => !outOfStock && setSelectedSize(size)}
                      className={`btn ${selectedSize === size ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      style={{ minWidth: 48, opacity: outOfStock ? 0.4 : 1 }}
                      disabled={outOfStock}>
                      {size}
                    </button>
                  );
                })}
              </div>
              {selectedVariant && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                Còn {selectedVariant.stockQuantity} sản phẩm
              </span>}
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '2rem' }}>
              <label className="form-label">Số lượng</label>
              <div className="cart-item-actions">
                <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q-1))}><FiMinus /></button>
                <span className="qty-display">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(q => q+1)}><FiPlus /></button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAddToCart}>
                <FiShoppingCart /> Thêm vào giỏ hàng
              </button>
              <button className="btn btn-outline btn-lg"><FiHeart /></button>
            </div>

            {/* Benefits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              {[
                { icon: <FiTruck />, label: 'Miễn phí ship' },
                { icon: <FiRefreshCw />, label: 'Đổi trả 30 ngày' },
                { icon: <FiShield />, label: 'Bảo hành chất lượng' },
              ].map((b, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem', color: 'var(--color-primary)' }}>{b.icon}</div>
                  {b.label}
                </div>
              ))}
            </div>

            {/* Details */}
            {product.material && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Chi tiết sản phẩm</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Chất liệu:</span><span>{product.material}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Thương hiệu:</span><span>{product.brand}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>SKU:</span><span>{selectedVariant?.sku || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
