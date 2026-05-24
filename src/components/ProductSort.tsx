'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface ProductSortProps {
  currentSort: string;
}

export default function ProductSort({ currentSort }: ProductSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentSort}
      onChange={(e) => handleSortChange(e.target.value)}
      className="bg-transparent border-none text-xs font-bold uppercase tracking-wider text-[#8B3A2A] focus:ring-0 focus:outline-none cursor-pointer"
    >
      <option value="featured">Featured</option>
      <option value="newest">Newest Arrivals</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
