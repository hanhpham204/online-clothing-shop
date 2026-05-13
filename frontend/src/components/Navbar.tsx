'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSearchStore } from '@/store/searchStore';
import { FiShoppingBag, FiSearch, FiUser, FiMenu, FiX, FiLogOut, FiPackage, FiMapPin, FiSettings, FiClock, FiTrendingUp } from 'react-icons/fi';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loadUser, logout } = useAuthStore();
  const { suggestions, searchHistory, fetchSuggestions, fetchSearchHistory, clearSearchHistory } = useSearchStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = () => setDropdownOpen(false);
    if (dropdownOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setSearchOpen(false);
    setShowSearchDropdown(false);
  }, [pathname]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Search logic
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    } else {
      fetchSuggestions('');
    }
  }, [fetchSuggestions]);

  const handleSearchSubmit = (term?: string) => {
    const q = term || searchQuery;
    if (!q.trim()) return;
    setShowSearchDropdown(false);
    setSearchOpen(false);
    router.push(`/search?keyword=${encodeURIComponent(q.trim())}`);
  };

  const handleSearchFocus = () => {
    setShowSearchDropdown(true);
    if (isAuthenticated && !searchQuery) fetchSearchHistory();
  };

  const showSuggestions = suggestions.length > 0 && searchQuery.length >= 2;
  const showHistory = !searchQuery && isAuthenticated && searchHistory.length > 0;

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-inner">
        <Link href="/" className="logo">
          Vogue<span>Store</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li><Link href="/products" className={pathname === '/products' ? 'active' : ''}>Sản phẩm</Link></li>
            <li><Link href="/products?category=ao">Áo</Link></li>
            <li><Link href="/products?category=quan">Quần</Link></li>
            <li><Link href="/products?category=vay-dam">Váy & Đầm</Link></li>
            <li><Link href="/products?category=phu-kien">Phụ kiện</Link></li>
          </ul>
        </nav>

        <div className="header-actions">
          {/* Search toggle / inline bar */}
          <div className="nav-search-wrapper" ref={searchWrapperRef}>
            {searchOpen ? (
              <div className="nav-search-bar">
                <FiSearch className="nav-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="nav-search-input"
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={handleSearchFocus}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchSubmit();
                    if (e.key === 'Escape') { setSearchOpen(false); setShowSearchDropdown(false); }
                  }}
                  autoFocus
                />
                <button className="nav-search-close" onClick={() => { setSearchOpen(false); setSearchQuery(''); setShowSearchDropdown(false); }}>
                  <FiX />
                </button>

                {/* Search dropdown */}
                {showSearchDropdown && (showSuggestions || showHistory) && (
                  <div className="search-dropdown">
                    {showHistory && (
                      <>
                        <div className="search-dropdown-header">
                          <span><FiClock /> Tìm kiếm gần đây</span>
                          <button className="search-dropdown-clear" onClick={() => clearSearchHistory()}>Xóa</button>
                        </div>
                        {searchHistory.map((item, i) => (
                          <button key={i} className="search-dropdown-item" onClick={() => handleSearchSubmit(item)}>
                            <FiClock className="search-dropdown-item-icon" />
                            <span>{item}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {showSuggestions && (
                      <>
                        <div className="search-dropdown-header"><span><FiTrendingUp /> Gợi ý</span></div>
                        {suggestions.map((s, i) => (
                          <button key={i} className="search-dropdown-item" onClick={() => handleSearchSubmit(s)}>
                            <FiSearch className="search-dropdown-item-icon" />
                            <span dangerouslySetInnerHTML={{ __html: highlightMatch(s, searchQuery) }} />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-icon" aria-label="Tìm kiếm" onClick={() => { setSearchOpen(true); }}>
                <FiSearch />
              </button>
            )}
          </div>

          <Link href="/cart">
            <button className="btn btn-icon" aria-label="Giỏ hàng">
              <FiShoppingBag />
            </button>
          </Link>

          {isAuthenticated && user ? (
            <div className="user-dropdown-wrapper">
              <button className="user-avatar-btn" onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="avatar-img" />
                ) : (
                  <span className="avatar-initials">{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </button>

              {dropdownOpen && (
                <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-header">
                    <div className="dropdown-name">{user.fullName}</div>
                    <div className="dropdown-email">{user.email}</div>
                    {user.role === 'ADMIN' && <span className="dropdown-role">ADMIN</span>}
                  </div>
                  <div className="dropdown-divider" />
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="dropdown-item"><FiSettings /> Dashboard Admin</Link>
                  )}
                  <Link href="/profile" className="dropdown-item"><FiUser /> Tài khoản</Link>
                  <Link href="/orders" className="dropdown-item"><FiPackage /> Đơn hàng</Link>
                  <Link href="/profile#addresses" className="dropdown-item"><FiMapPin /> Địa chỉ</Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}><FiLogOut /> Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link href="/login"><button className="btn btn-sm btn-outline">Đăng nhập</button></Link>
              <Link href="/register"><button className="btn btn-sm btn-primary">Đăng ký</button></Link>
            </div>
          )}

          <button className="btn btn-icon mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          <Link href="/products" className="mobile-link">Sản phẩm</Link>
          <Link href="/search" className="mobile-link">🔍 Tìm kiếm</Link>
          <Link href="/products?category=ao" className="mobile-link">Áo</Link>
          <Link href="/products?category=quan" className="mobile-link">Quần</Link>
          <Link href="/products?category=vay-dam" className="mobile-link">Váy & Đầm</Link>
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="mobile-link">Tài khoản</Link>
              <Link href="/orders" className="mobile-link">Đơn hàng</Link>
              {user?.role === 'ADMIN' && <Link href="/admin" className="mobile-link">Admin</Link>}
              <button className="mobile-link mobile-logout" onClick={handleLogout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link href="/login" className="mobile-link">Đăng nhập</Link>
              <Link href="/register" className="mobile-link">Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>');
}
