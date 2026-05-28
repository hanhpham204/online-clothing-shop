'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders?page=0&size=50');
      setOrders(res.data.data.content || []);
    } catch {} finally { setLoading(false); }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem' }}>Quản Lý Đơn Hàng</h1>

      {loading ? <div>Đang tải...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontWeight: 600 }}>{order.orderCode}</td>
                <td>{order.shippingName}<br/><span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{order.shippingPhone}</span></td>
                <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{formatPrice(order.totalAmount)}</td>
                <td>
                  <span className="status-badge" style={{ background: getStatusColor(order.status) + '15', color: getStatusColor(order.status) }}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td>
                  <span className="status-badge" style={{ background: getStatusColor(order.paymentStatus) + '15', color: getStatusColor(order.paymentStatus) }}>
                    {getStatusLabel(order.paymentStatus)}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{formatDate(order.createdAt)}</td>
                <td>
                  <select
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    value={order.status}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
