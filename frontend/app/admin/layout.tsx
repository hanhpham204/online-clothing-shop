'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FiBarChart2, FiPackage, FiShoppingBag, FiUsers, FiGrid, FiLogOut, FiHome } from 'react-icons/fi';

const navItems = [
  { href: '/admin', icon: <FiBarChart2 />, label: 'Tổng quan' },
  { href: '/admin/products', icon: <FiShoppingBag />, label: 'Sản phẩm' },
  { href: '/admin/orders', icon: <FiPackage />, label: 'Đơn hàng' },
  { href: '/admin/users', icon: <FiUsers />, label: 'Người dùng' },
  { href: '/admin/categories', icon: <FiGrid />, label: 'Danh mục' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  // Wait for loading to complete before checking auth
  useEffect(() => {
    if (isLoading) return; // Still loading from localStorage — wait

    if (!isAuthenticated) {
      router.push('/login');
    } else if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show loading screen while auth state is being determined
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // If not admin after loading, show nothing (redirect will happen via useEffect)
  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Vogue<span style={{ color: 'var(--color-accent)' }}>Store</span></h2>
        <nav>
          <ul className="admin-nav">
            {navItems.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={pathname === item.href ? 'active' : ''}>
                  {item.icon} {item.label}
                </Link>
              </li>
            ))}
            <li style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <Link href="/"><FiHome /> Về trang chủ</Link>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                <FiLogOut /> Đăng xuất
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
