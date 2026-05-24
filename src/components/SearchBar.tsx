'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';

interface SearchResult {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string; alt: string }[];
  category: string;
}

interface SearchBarProps {
  onClose: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Auto-focus when mounted
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    // Debounce 300ms
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchResults(val), 300);
  };

  const navigateToSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = results.length + (results.length > 0 ? 1 : 0); // +1 for "See all"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex === results.length) {
        // "See all results" is focused
        navigateToSearch();
      } else if (activeIndex >= 0 && results[activeIndex]) {
        router.push(`/products/${results[activeIndex].slug}`);
        onClose();
      } else {
        navigateToSearch();
      }
    }
  };

  const showDropdown = query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigateToSearch();
        }}
        className="flex items-center gap-3 bg-white border border-amber-900/15 rounded-sm px-4 py-3 shadow-lg"
      >
        {loading ? (
          <Loader2 size={18} className="text-[#8B3A2A] animate-spin flex-shrink-0" />
        ) : (
          <Search size={18} className="text-amber-950/40 flex-shrink-0" />
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search for henna cones, powders, kits..."
          className="flex-1 text-sm bg-transparent border-none outline-none text-amber-950 placeholder:text-amber-950/40 font-light"
          autoComplete="off"
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
          aria-controls="search-results"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
        />
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-amber-950/40 hover:text-amber-950 transition-colors flex-shrink-0"
          aria-label="Close search"
        >
          <X size={16} />
        </button>
      </form>

      {/* Dropdown results */}
      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-amber-900/10 rounded-sm shadow-xl z-50 overflow-hidden"
        >
          {results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-xs text-amber-950/50 font-light">
              No products found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="divide-y divide-amber-900/5">
              {results.map((product, idx) => {
                const isActive = idx === activeIndex;
                const image = product.images[0]?.url;
                const imageAlt = product.images[0]?.alt || product.name;

                return (
                  <li
                    key={product._id}
                    id={`search-result-${idx}`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-[#8B3A2A]/5'
                          : 'hover:bg-amber-950/[0.03]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-stone-100 rounded flex-shrink-0 overflow-hidden">
                        {image ? (
                          <Image
                            src={image}
                            alt={imageAlt}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 text-[10px]">
                            No img
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-950 truncate">{product.name}</p>
                        <p className="text-[10px] text-amber-950/50 uppercase tracking-wider">
                          {product.category.replace('-', ' ')}
                        </p>
                      </div>

                      {/* Price */}
                      <p className="text-sm font-bold text-[#8B3A2A] flex-shrink-0">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                    </Link>
                  </li>
                );
              })}

              {/* See all results link */}
              {results.length > 0 && (
                <li
                  id={`search-result-${results.length}`}
                  role="option"
                  aria-selected={activeIndex === results.length}
                >
                  <button
                    onClick={navigateToSearch}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#8B3A2A] transition-colors ${
                      activeIndex === results.length
                        ? 'bg-[#8B3A2A]/5'
                        : 'hover:bg-[#8B3A2A]/5'
                    }`}
                  >
                    <span>See all results for &ldquo;{query}&rdquo;</span>
                    <ArrowRight size={12} />
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
