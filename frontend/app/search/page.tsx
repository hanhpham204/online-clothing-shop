'use client';

import { Suspense, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchStore } from '@/store/searchStore';
import api from '@/lib/api';
import { Category } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FiShoppingBag, FiStar, FiChevronLeft, FiChevronRight, FiSearch, FiX, FiFilter, FiSliders } from 'react-icons/fi';
import { useState } from 'react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'best_seller', label: 'Bán chạy nhất' },
  { value: 'name_asc', label: 'Tên A → Z' },
];

const PRICE_RANGES = [
  { label: 'Tất cả', min: null, max: null },
  { label: 'Dưới 200K', min: null, max: 200000 },
  { label: '200K - 500K', min: 200000, max: 500000 },
  { label: '500K - 1 triệu', min: 500000, max: 1000000 },
  { label: 'Trên 1 triệu', min: 1000000, max: null },
];

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    filters,
    results,
    totalPages,
    totalElements,
    loading,
    availableSizes,
    availableColors,
    setFilter,
    setFilters,
    resetFilters,
    search,
    fetchAvailableFilters,
    setPage,
  } = useSearchStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse initial URL params on mount
  useEffect(() => {
    const keyword = searchParams.get('keyword') || '';
    const categoryId = searchParams.get('categoryId');
    const sort = searchParams.get('sort') || 'newest';
    const size = searchParams.get('size') || null;
    const color = searchParams.get('color') || null;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = searchParams.get('page');

    setFilters({
      keyword,
      categoryId: categoryId ? parseInt(categoryId) : null,
      sort,
      size,
      color,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      page: page ? parseInt(page) : 0,
    });

    fetchAvailableFilters();
    fetchCategories();
  }, []);

  // Execute search when filters change
  useEffect(() => {
    search();
    updateURL();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/all');
      setCategories(res.data.data || []);
    } catch { /* ignore */ }
  };

  // Sync filters to URL without navigation
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.categoryId) params.set('categoryId', filters.categoryId.toString());
    if (filters.minPrice !== null) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== null) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.size) params.set('size', filters.size);
    if (filters.color) params.set('color', filters.color);
    if (filters.sort !== 'newest') params.set('sort', filters.sort);
    if (filters.page > 0) params.set('page', filters.page.toString());

    const paramStr = params.toString();
    const newUrl = paramStr ? `/search?${paramStr}` : '/search';
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const activeFilterCount = [
    filters.categoryId,
    filters.size,
    filters.color,
    filters.minPrice !== null || filters.maxPrice !== null,
  ].filter(Boolean).length;

  return (
    <>
      <Navbar />

      <div className="search-page">
        <div className="search-page-inner">

          {/* Search header */}
          <div className="search-page-header">
            <div className="search-page-input-row">
              <div className="search-bar">
                <FiSearch className="search-bar-icon" />
                <input
                  type="text"
                  className="search-bar-input"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={filters.keyword}
                  onChange={(e) => setFilter('keyword', e.target.value)}
                  autoFocus
                />
                {filters.keyword && (
                  <button className="search-bar-clear" onClick={() => setFilter('keyword', '')}><FiX /></button>
                )}
              </div>

              {/* Mobile filter toggle */}
              <button className="btn btn-outline filter-toggle-btn" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                <FiSliders /> Lọc {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              </button>
            </div>

            <div className="search-meta">
              <span className="search-result-count">
                {loading ? 'Đang tìm...' : `${totalElements} kết quả`}
                {filters.keyword && <> cho <strong>"{filters.keyword}"</strong></>}
              </span>

              <select
                className="search-sort-select"
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="search-layout">

            {/* Filter Sidebar */}
            <aside className={`search-sidebar ${showMobileFilters ? 'search-sidebar-open' : ''}`}>
              <div className="search-sidebar-header">
                <h3><FiFilter /> Bộ lọc</h3>
                {activeFilterCount > 0 && (
                  <button className="search-sidebar-reset" onClick={() => {
                    resetFilters();
                    setShowMobileFilters(false);
                  }}>Xóa tất cả</button>
                )}
              </div>

              {/* Category Filter */}
              <div className="filter-section">
                <h4>Danh mục</h4>
                <div className="filter-options">
                  <label className={`filter-option ${!filters.categoryId ? 'active' : ''}`}>
                    <input type="radio" name="category" checked={!filters.categoryId}
                      onChange={() => setFilter('categoryId', null)} />
                    <span>Tất cả</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className={`filter-option ${filters.categoryId === cat.id ? 'active' : ''}`}>
                      <input type="radio" name="category" checked={filters.categoryId === cat.id}
                        onChange={() => setFilter('categoryId', cat.id)} />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="filter-section">
                <h4>Khoảng giá</h4>
                <div className="filter-options">
                  {PRICE_RANGES.map((range, i) => {
                    const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
                    return (
                      <label key={i} className={`filter-option ${isActive ? 'active' : ''}`}>
                        <input type="radio" name="price" checked={isActive}
                          onChange={() => setFilters({ minPrice: range.min, maxPrice: range.max })} />
                        <span>{range.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div className="filter-section">
                  <h4>Kích thước</h4>
                  <div className="filter-chips">
                    {availableSizes.map((s) => (
                      <button key={s}
                        className={`filter-chip ${filters.size === s ? 'active' : ''}`}
                        onClick={() => setFilter('size', filters.size === s ? null : s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {availableColors.length > 0 && (
                <div className="filter-section">
                  <h4>Màu sắc</h4>
                  <div className="filter-chips">
                    {availableColors.map((c) => (
                      <button key={c}
                        className={`filter-chip ${filters.color === c ? 'active' : ''}`}
                        onClick={() => setFilter('color', filters.color === c ? null : c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile: Apply button */}
              <button className="btn btn-primary filter-apply-btn" onClick={() => setShowMobileFilters(false)}>
                Xem kết quả ({totalElements})
              </button>
            </aside>

            {/* Results Grid */}
            <main className="search-results">
              {loading ? (
                <div className="product-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="product-card">
                      <div className="product-card-image skeleton" style={{ height: '280px' }} />
                      <div className="product-card-body">
                        <div className="skeleton" style={{ height: '12px', width: '50px', marginBottom: '6px' }} />
                        <div className="skeleton" style={{ height: '16px', width: '85%', marginBottom: '6px' }} />
                        <div className="skeleton" style={{ height: '18px', width: '100px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="search-empty">
                  <FiSearch size={56} />
                  <h3>Không tìm thấy kết quả</h3>
                  <p>
                    {filters.keyword
                      ? <>Không có sản phẩm nào phù hợp với "<strong>{filters.keyword}</strong>". Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc.</>
                      : 'Hãy nhập từ khóa hoặc chọn bộ lọc để bắt đầu tìm kiếm.'}
                  </p>
                  {activeFilterCount > 0 && (
                    <button className="btn btn-outline" onClick={resetFilters}>
                      <FiX /> Xóa bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <div className="product-grid">
                  {results.map((product, i) => (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                      <div className="product-card animate-in" style={{ animationDelay: `${i * 0.04}s` }}>
                        <div className="product-card-image">
                          {product.images?.[0]?.imageUrl ? (
                            <img src={resolveImageUrl(product.images[0].imageUrl)} alt={product.name} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#ccc' }}>
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
                          <h3 className="product-card-name"
                            dangerouslySetInnerHTML={{
                              __html: filters.keyword
                                ? highlightMatch(product.name, filters.keyword)
                                : product.name
                            }}
                          />
                          <div className="product-card-price">
                            <span className="price-current">{formatPrice(product.effectivePrice)}</span>
                            {product.salePrice && (
                              <span className="price-original">{formatPrice(product.basePrice)}</span>
                            )}
                          </div>
                          {product.avgRating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#f59e0b', fontSize: '0.8rem' }}>
                              <FiStar fill="#f59e0b" size={12} /> {product.avgRating.toFixed(1)} ({product.reviewCount})
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="search-pagination">
                  <button className="btn btn-outline btn-sm"
                    onClick={() => setPage(filters.page - 1)}
                    disabled={filters.page === 0}>
                    <FiChevronLeft /> Trước
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (filters.page < 3) {
                        pageNum = i;
                      } else if (filters.page >= totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = filters.page - 2 + i;
                      }
                      return (
                        <button key={pageNum}
                          className={`pagination-btn ${filters.page === pageNum ? 'active' : ''}`}
                          onClick={() => setPage(pageNum)}>
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => setPage(filters.page + 1)}
                    disabled={filters.page >= totalPages - 1}>
                    Sau <FiChevronRight />
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}
