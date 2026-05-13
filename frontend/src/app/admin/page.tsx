'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Statistics } from '@/types';
import { formatPrice } from '@/lib/utils';
import { FiTrendingUp, FiShoppingBag, FiUsers, FiDollarSign, FiClock, FiPackage } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/statistics/overview');
      setStats(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  if (loading || !stats) return <div>Đang tải...</div>;

  const statCards = [
    { label: 'Tổng doanh thu', value: formatPrice(stats.totalRevenue), icon: <FiDollarSign />, color: 'accent' },
    { label: 'Doanh thu hôm nay', value: formatPrice(stats.todayRevenue), icon: <FiTrendingUp />, color: 'success' },
    { label: 'Doanh thu tháng', value: formatPrice(stats.monthRevenue), icon: <FiTrendingUp />, color: 'success' },
    { label: 'Tổng đơn hàng', value: stats.totalOrders.toString(), icon: <FiShoppingBag />, color: '' },
    { label: 'Đơn hôm nay', value: stats.todayOrders.toString(), icon: <FiPackage />, color: '' },
    { label: 'Đơn chờ xử lý', value: stats.pendingOrders.toString(), icon: <FiClock />, color: 'accent' },
    { label: 'Tổng người dùng', value: stats.totalUsers.toString(), icon: <FiUsers />, color: '' },
    { label: 'Tổng sản phẩm', value: stats.totalProducts.toString(), icon: <FiShoppingBag />, color: '' },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem' }}>Tổng Quan</h1>

      <div className="stat-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-card-label">{card.label}</div>
                <div className={`stat-card-value ${card.color}`}>{card.value}</div>
              </div>
              <div style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)', opacity: 0.5 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
