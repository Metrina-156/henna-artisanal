'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface CategoryCount {
  category: string;
  count: number;
}

interface ProductFiltersProps {
  categories: CategoryCount[];
  allTags: string[];
}

export default function ProductFilters({ categories, allTags }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Local state for price inputs
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');

  // Helper to get category human name
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'henna-cones': return 'Fresh Henna Cones';
      case 'powders': return 'Organic Powders';
      case 'kits': return 'Artisanal Kits';
      case 'masks': return 'Botanical Hair Masks';
      case 'accessories': return 'Tools & Accessories';
      default: return category;
    }
  };

  // Update query params helper
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 on filter changes
    params.set('page', '1');

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleCategorySelect = (category: string) => {
    const activeCategory = searchParams.get('category');
    updateQuery({ category: activeCategory === category ? null : category });
  };

  const handleTagSelect = (tag: string) => {
    const activeTag = searchParams.get('tag');
    updateQuery({ tag: activeTag === tag ? null : tag });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ minPrice, maxPrice });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchVal });
  };

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchVal('');
    startTransition(() => {
      router.push(pathname);
    });
  };

  const currentCategory = searchParams.get('category');
  const currentTag = searchParams.get('tag');
  const currentSort = searchParams.get('sort') || 'featured';

  const hasActiveFilters = 
    searchParams.has('category') || 
    searchParams.has('tag') || 
    searchParams.has('search') || 
    searchParams.has('minPrice') || 
    searchParams.has('maxPrice');

  return (
    <aside className="w-full p-4 lg:p-6 bg-[#F5EFE6]/30 border border-amber-900/5 rounded-lg text-amber-950">
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full lg:hidden flex justify-between items-center text-amber-950 font-serif font-bold text-sm cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[#8B3A2A]" />
          Filter & Sort {hasActiveFilters && `(${[
            searchParams.get('category') ? 1 : 0,
            searchParams.get('tag') ? 1 : 0,
            searchParams.get('search') ? 1 : 0,
            (searchParams.get('minPrice') || searchParams.get('maxPrice')) ? 1 : 0
          ].reduce((a, b) => a + b, 0)})`}
        </span>
        <span className="text-xs text-[#8B3A2A] font-sans font-semibold uppercase tracking-wider">
          {isOpen ? 'Close' : 'Expand'}
        </span>
      </button>

      {/* Filter Options Content */}
      <div className={`space-y-6 lg:space-y-8 lg:block ${isOpen ? 'block mt-6 border-t border-amber-950/10 pt-6 animate-in fade-in duration-200' : 'hidden'}`}>
        <div className="flex justify-between items-center border-b border-amber-950/10 pb-4 hidden lg:flex">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-[#8B3A2A]" />
            Filter & Sort
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#8B3A2A] hover:underline font-semibold flex items-center gap-1"
            >
              Clear All
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end lg:hidden">
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#8B3A2A] hover:underline font-semibold"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-950/60 block">Search Products</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-[#F5EFE6] border border-amber-950/20 text-amber-950 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#8B3A2A] pr-8"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => {
                  setSearchVal('');
                  updateQuery({ search: null });
                }}
                className="absolute right-2 top-2.5 text-amber-950/40 hover:text-amber-950"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-2.5 text-amber-950/60 hover:text-[#8B3A2A] hidden"
            >
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* Sort Option Dropdown for Mobile (visible in sidebar, synchronized with desktop topbar) */}
        <div className="space-y-2 lg:hidden">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-950/60 block">Sort By</label>
          <select
            value={currentSort}
            onChange={(e) => updateQuery({ sort: e.target.value })}
            className="w-full bg-[#F5EFE6] border border-amber-950/20 text-amber-950 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#8B3A2A]"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950/60 block">Categories</h3>
          <div className="space-y-2">
            {categories.map(({ category, count }) => {
              const isActive = currentCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full flex items-center justify-between text-sm py-1.5 px-2 rounded transition-colors text-left ${
                    isActive
                      ? 'bg-[#8B3A2A] text-[#F5EFE6] font-medium'
                      : 'hover:bg-amber-900/5 text-amber-950/80'
                  }`}
                >
                  <span>{getCategoryLabel(category)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-[#F5EFE6]/20' : 'bg-amber-950/5'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950/60 block">Price Range (₹)</h3>
          <form onSubmit={handlePriceApply} className="space-y-3">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-[#F5EFE6] border border-amber-950/20 text-amber-950 rounded px-3 py-1.5 text-xs text-center focus:outline-none focus:border-[#8B3A2A]"
              />
              <span className="text-amber-950/40 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-[#F5EFE6] border border-amber-950/20 text-amber-950 rounded px-3 py-1.5 text-xs text-center focus:outline-none focus:border-[#8B3A2A]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Apply Price
            </button>
          </form>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950/60 block">Filter by Tag</h3>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const isActive = currentTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    isActive
                      ? 'bg-amber-900 text-white font-medium'
                      : 'bg-[#F5EFE6] border border-amber-950/10 text-amber-950/70 hover:bg-[#F5EFE6]/80'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {isPending && (
          <div className="text-xs text-amber-950/60 animate-pulse text-center pt-2">
            Updating results...
          </div>
        )}
      </div>
    </aside>
  );
}
