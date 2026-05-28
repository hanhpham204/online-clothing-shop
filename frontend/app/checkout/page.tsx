'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Cart, Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user, loadUser } = useAuthStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    note: '',
    paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'COD',
  });

  useEffect(() => {
    loadUser();
    fetchCart();
  }, []);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        shippingName: f.shippingName || user.fullName || '',
        shippingPhone: f.shippingPhone || user.phone || '',
      }));
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.data);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        shippingName: form.shippingName,
        shippingPhone: form.shippingPhone,
        shippingAddress: form.shippingAddress,
        note: form.note,
        paymentMethod: form.paymentMethod,
      });
      const order: Order = res.data.data;
      toast.success('Đặt hàng thành công!');

      if (form.paymentMethod === 'COD') {
        // COD: skip payment page, go directly to orders list
        router.push('/orders');
      } else {
        // BANK_TRANSFER: redirect to QR payment page
        router.push(`/orders/${order.id}/payment`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div style={{ textAlign: 'center', padding: '6rem' }}>
      <p>Vui lòng đăng nhập</p>
      <Link href="/login"><button className="btn btn-primary">Đăng nhập</button></Link>
    </div>;
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">Vogue<span>Store</span></Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem' }}>Thanh Toán</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '1rem' }}>Thông tin giao hàng</h3>

            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input className="form-input" value={form.shippingName}
                onChange={e => setForm({...form, shippingName: e.target.value})} required />
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input className="form-input" value={form.shippingPhone}
                onChange={e => setForm({...form, shippingPhone: e.target.value})} required />
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ giao hàng</label>
              <input className="form-input" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                value={form.shippingAddress}
                onChange={e => setForm({...form, shippingAddress: e.target.value})} required />
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú (tùy chọn)</label>
              <input className="form-input" placeholder="Ghi chú cho người giao hàng..."
                value={form.note}
                onChange={e => setForm({...form, note: e.target.value})} />
            </div>

            {/* Payment Method Selection */}
            <div style={{ padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Phương thức thanh toán</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Bank Transfer Option */}
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${form.paymentMethod === 'BANK_TRANSFER' ? 'var(--color-accent)' : 'var(--color-border-light)'}`,
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={form.paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setForm({ ...form, paymentMethod: 'BANK_TRANSFER' })}
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{ fontSize: '1.2rem' }}>🏦</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Chuyển khoản ngân hàng (QR Code)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Thanh toán qua mã QR, xác nhận tự động</div>
                  </div>
                </label>

                {/* COD Option */}
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${form.paymentMethod === 'COD' ? 'var(--color-accent)' : 'var(--color-border-light)'}`,
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={form.paymentMethod === 'COD'}
                    onChange={() => setForm({ ...form, paymentMethod: 'COD' })}
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{ fontSize: '1.2rem' }}>💵</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Thanh toán khi nhận hàng (COD)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Thanh toán tiền mặt khi nhận được hàng</div>
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Đang xử lý...' : (form.paymentMethod === 'COD' ? 'Đặt hàng (COD)' : 'Đặt hàng & Thanh toán')}
            </button>
          </form>

          {/* Order Summary */}
          {cart && (
            <div className="cart-summary">
              <h3>Đơn hàng ({cart.totalItems} sản phẩm)</h3>
              {cart.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.productName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {item.color} / {item.size} x{item.quantity}
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
              <div className="summary-row" style={{ marginTop: '1rem' }}>
                <span>Tạm tính</span><span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển</span><span>30.000₫</span>
              </div>
              <div className="summary-row summary-total">
                <span>Tổng cộng</span>
                <span style={{ color: 'var(--color-accent)' }}>{formatPrice(cart.totalAmount + 30000)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
