'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/store/cartStore';

// Types for Product structure matching mongoose model
interface ProductCardProps {
  product: {
    _id?: string;
    id?: string; // fallback
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    compareAtPrice?: number;
    images: { url: string; publicId: string; alt: string }[];
    category: string;
    tags: string[];
    stock: number;
    createdAt: string | Date;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCart((state) => state.addToCart);

  const productId = product._id?.toString() || product.id || '';
  const mainImage = product.images[0]?.url || '/images/placeholder.jpg';
  const mainAlt = product.images[0]?.alt || product.name;

  // Badge calculations
  const createdAtTime = new Date(product.createdAt).getTime();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const isNew = createdAtTime > thirtyDaysAgo;
  const isSale = !!(product.compareAtPrice && product.compareAtPrice > product.price);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop navigation to product details page
    e.stopPropagation();

    if (product.stock <= 0) return;

    addToCart(
      {
        productId,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: mainImage,
        stock: product.stock,
      },
      1
    );
  };

  return (
    <div className="relative group w-full">

      <Link href={`/products/${product.slug}`} className="block">
        <div className="bg-[#F5EFE6]/40 rounded-lg overflow-hidden border border-amber-900/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl relative aspect-[4/5] mb-4">
          
          {/* Images Section */}
          <div className="w-full h-full relative overflow-hidden bg-stone-200">
            <Image
              src={mainImage}
              alt={mainAlt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Soft overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {isNew && (
              <span className="bg-[#8B3A2A] text-[#F5EFE6] text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1 shadow-sm rounded-sm">
                NEW
              </span>
            )}
            {isSale && (
              <span className="bg-amber-700 text-white text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1 shadow-sm rounded-sm">
                SALE
              </span>
            )}
            {product.stock <= 0 && (
              <span className="bg-stone-800 text-stone-300 text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1 shadow-sm rounded-sm">
                OUT OF STOCK
              </span>
            )}
          </div>

          {/* Quick-Add CTA Overlay */}
          {product.stock > 0 && (
            <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
              <button
                onClick={handleQuickAdd}
                className="bg-[#F5EFE6] hover:bg-[#8B3A2A] hover:text-[#F5EFE6] text-[#8B3A2A] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2"
              >
                <ShoppingBag size={14} />
                <span>Quick Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Meta */}
        <div className="px-1">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-serif text-lg text-amber-950 font-semibold group-hover:text-[#8B3A2A] transition-colors leading-tight">
              {product.name}
            </h3>
            <div className="flex flex-col items-end">
              <span className="text-base font-semibold text-[#8B3A2A]">
                ₹{product.price}
              </span>
              {isSale && product.compareAtPrice && (
                <span className="text-xs text-amber-950/40 line-through">
                  ₹{product.compareAtPrice}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-xs text-amber-950/60 line-clamp-2 mb-3 leading-relaxed font-light">
            {product.shortDescription}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wider text-amber-900/50 bg-[#F5EFE6]/60 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
