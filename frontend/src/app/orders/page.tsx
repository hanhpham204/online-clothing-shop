'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { FiPackage, FiEye } from 'react-icons/fi';

export default function OrdersPage() {
  const { isAuthenticated, loadUser } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders?page=0&size=50');
      setOrders(res.data.data.content || []);
    } catch {} finally { setLoading(false); }
  };

  const cancelOrder = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      fetchOrders();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi hủy đơn hàng');
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">Vogue<span>Store</span></Link>
          <Link href="/products"><button className="btn btn-sm btn-outline">Tiếp tục mua sắm</button></Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem' }}>Đơn Hàng Của Tôi</h1>

        {loading ? (
          <div>Đang tải...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <FiPackage size={48} style={{ color: '#ddd', marginBottom: '1rem' }} />
            <p>Bạn chưa có đơn hàng nào</p>
            <Link href="/products"><button className="btn btn-primary" style={{ marginTop: '1rem' }}>Mua sắm ngay</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', padding: '1.5rem', transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, marginRight: '1rem' }}>{order.orderCode}</span>
                    <span className="status-badge" style={{ background: getStatusColor(order.status) + '15', color: getStatusColor(order.status) }}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="status-badge" style={{ background: getStatusColor(order.paymentStatus) + '15', color: getStatusColor(order.paymentStatus), marginLeft: '0.5rem' }}>
                      {getStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{formatDate(order.createdAt)}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>{item.productName} ({item.color}/{item.size}) x{item.quantity}</span>
                      <span style={{ fontWeight: 600 }}>{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Tổng: <span style={{ color: 'var(--color-accent)' }}>{formatPrice(order.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {order.status === 'PENDING' && order.paymentStatus === 'UNPAID' && order.paymentMethod !== 'COD' && (
                      <>
                        <Link href={`/orders/${order.id}/payment`}>
                          <button className="btn btn-primary btn-sm">Thanh toán</button>
                        </Link>
                        <button className="btn btn-outline btn-sm" onClick={() => cancelOrder(order.id)}>Hủy</button>
                      </>
                    )}
                    {order.paymentMethod === 'COD' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                        💵 COD
                      </span>
                    )}
                    {order.status === 'PENDING' && order.paymentMethod === 'COD' && (
                      <button className="btn btn-outline btn-sm" onClick={() => cancelOrder(order.id)}>Hủy</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
