'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Cart } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useAuthStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const updateQuantity = async (id: number, qty: number) => {
    try {
      const res = await api.put(`/cart/items/${id}`, { quantity: qty });
      setCart(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  const removeItem = async (id: number) => {
    try {
      const res = await api.delete(`/cart/items/${id}`);
      setCart(res.data.data);
      toast.success('Đã xóa sản phẩm');
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="logo">Vogue<span>Store</span></Link>
          </div>
        </header>
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <FiShoppingBag size={56} style={{ color: '#ddd', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Vui lòng đăng nhập</h2>
          <Link href="/login"><button className="btn btn-primary">Đăng nhập</button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">Vogue<span>Store</span></Link>
          <Link href="/products"><button className="btn btn-sm btn-outline">Tiếp tục mua sắm</button></Link>
        </div>
      </header>

      <div className="cart-page">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem' }}>
          Giỏ Hàng {cart && <span style={{ fontWeight: 400, fontSize: '1rem', color: 'var(--color-text-secondary)' }}>({cart.totalItems} sản phẩm)</span>}
        </h1>

        {loading ? (
          <div>Đang tải...</div>
        ) : !cart || cart.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <FiShoppingBag size={56} style={{ color: '#ddd', marginBottom: '1rem' }} />
            <h3>Giỏ hàng trống</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Hãy thêm sản phẩm yêu thích vào giỏ hàng</p>
            <Link href="/products"><button className="btn btn-primary">Khám phá sản phẩm</button></Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
            <div>
              {cart.items.map(item => (
                <div key={item.id} className="cart-item">
                  <div style={{ width: 100, height: 120, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                    {item.imageUrl ? <img src={resolveImageUrl(item.imageUrl)} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div className="cart-item-info">
                    <Link href={`/products/${item.productSlug}`}>
                      <div className="cart-item-name">{item.productName}</div>
                    </Link>
                    <div className="cart-item-variant">
                      {item.color} / {item.size}
                      {item.colorCode && (
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: item.colorCode, marginLeft: 6, verticalAlign: 'middle', border: '1px solid #ddd' }} />
                      )}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.5rem' }}>{formatPrice(item.unitPrice)}</div>
                    <div className="cart-item-actions">
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}><FiMinus size={14} /></button>
                      <span className="qty-display">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}><FiPlus size={14} /></button>
                      <button className="qty-btn" onClick={() => removeItem(item.id)} style={{ marginLeft: 'auto', color: 'var(--color-error)' }}><FiTrash2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(item.totalPrice)}</div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Tóm tắt đơn hàng</h3>
              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span style={{ color: 'var(--color-success)' }}>30.000₫</span>
              </div>
              <div className="summary-row summary-total">
                <span>Tổng cộng</span>
                <span style={{ color: 'var(--color-accent)' }}>{formatPrice(cart.totalAmount + 30000)}</span>
              </div>
              <Link href="/checkout">
                <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}>
                  Thanh toán <FiArrowRight />
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
