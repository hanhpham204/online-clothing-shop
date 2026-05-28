'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, getStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('UNPAID');
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, []);

  useEffect(() => {
    if (!polling || paymentStatus === 'PAID') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/payment/${orderId}/status`);
        const status = res.data.data.status;
        setPaymentStatus(status);
        if (status === 'PAID') {
          setPolling(false);
          toast.success('Thanh toán thành công! 🎉');
          // Refresh order
          fetchOrder();
        }
      } catch {}
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [polling, paymentStatus, orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.data);
      setPaymentStatus(res.data.data.paymentStatus);
      if (res.data.data.paymentStatus === 'PAID') setPolling(false);
    } catch {
      toast.error('Không thể tải thông tin đơn hàng');
    }
  };

  if (!order) return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải...</div>;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">Vogue<span>Store</span></Link>
        </div>
      </header>

      <div className="payment-page animate-in">
        {paymentStatus === 'PAID' ? (
          <div className="qr-container" style={{ background: '#f0fdf4' }}>
            <FiCheckCircle size={64} style={{ color: 'var(--color-success)', marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }}>Thanh toán thành công!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Đơn hàng <strong>{order.orderCode}</strong> đã được thanh toán
            </p>
            <Link href="/orders">
              <button className="btn btn-primary">Xem đơn hàng của tôi</button>
            </Link>
          </div>
        ) : (
          <div className="qr-container">
            <h2 style={{ marginBottom: '0.5rem' }}>Quét mã QR để thanh toán</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Đơn hàng: <strong>{order.orderCode}</strong>
            </p>

            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)', marginBottom: '1rem' }}>
              {formatPrice(order.totalAmount)}
            </div>

            {order.qrCodeUrl && (
              <img src={order.qrCodeUrl} alt="QR Code thanh toán"
                style={{ maxWidth: 280, margin: '0 auto', display: 'block', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
            )}

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <p><strong>Nội dung chuyển khoản:</strong></p>
              <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--color-accent)', fontWeight: 700, margin: '0.5rem 0' }}>
                {order.paymentCode}
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                ⚠️ Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống tự động xác nhận
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--color-warning)' }}>
              <FiClock />
              <span style={{ fontSize: '0.9rem' }}>Đang chờ thanh toán...</span>
              {polling && <FiRefreshCw className="spin" style={{ animation: 'spin 2s linear infinite' }} />}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </>
  );
}
