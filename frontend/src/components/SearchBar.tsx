'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useAuthStore } from '@/store/authStore';
import { FiSearch, FiX, FiClock, FiTrendingUp } from 'react-icons/fi';

export default function SearchBar() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    suggestions,
    searchHistory,
    suggestLoading,
    fetchSuggestions,
    fetchSearchHistory,
    clearSearchHistory,
  } = useSearchStore();

  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch history when dropdown opens for authenticated user
  useEffect(() => {
    if (showDropdown && isAuthenticated && !query) {
      fetchSearchHistory();
    }
  }, [showDropdown, isAuthenticated, query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced suggestion fetch
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      // When query is short, show nothing or history
      fetchSuggestions('');
    }
  }, [fetchSuggestions]);

  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || query;
    if (!term.trim()) return;

    setShowDropdown(false);
    // Navigate to search page with keyword
    router.push(`/search?keyword=${encodeURIComponent(term.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    fetchSuggestions('');
    inputRef.current?.focus();
  };

  const showSuggestions = suggestions.length > 0 && query.length >= 2;
  const showHistory = !query && isAuthenticated && searchHistory.length > 0;

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <FiSearch className="search-bar-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-bar-input"
          placeholder="Tìm kiếm sản phẩm..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && (
          <button className="search-bar-clear" onClick={handleClear} type="button">
            <FiX />
          </button>
        )}
        <button className="search-bar-submit" onClick={() => handleSearch()} type="button">
          Tìm
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (showSuggestions || showHistory) && (
        <div className="search-dropdown" ref={dropdownRef}>
          {/* Search History */}
          {showHistory && (
            <>
              <div className="search-dropdown-header">
                <span><FiClock /> Tìm kiếm gần đây</span>
                <button className="search-dropdown-clear" onClick={() => clearSearchHistory()}>
                  Xóa tất cả
                </button>
              </div>
              {searchHistory.map((item, i) => (
                <button
                  key={i}
                  className="search-dropdown-item"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <FiClock className="search-dropdown-item-icon" />
                  <span>{item}</span>
                </button>
              ))}
            </>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <>
              {query && <div className="search-dropdown-header"><span><FiTrendingUp /> Gợi ý</span></div>}
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="search-dropdown-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <FiSearch className="search-dropdown-item-icon" />
                  <span dangerouslySetInnerHTML={{
                    __html: highlightMatch(suggestion, query)
                  }} />
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Highlight matched portion of text.
 */
function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}
