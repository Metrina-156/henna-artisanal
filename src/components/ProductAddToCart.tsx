'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/store/cartStore';

interface ProductAddToCartProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: { url: string }[];
  };
}

export default function ProductAddToCart({ product }: ProductAddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCart((state) => state.addToCart);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '',
        stock: product.stock,
      },
      quantity
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Stock Status Indicator */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-stone-500 bg-stone-500/10 px-3 py-1 rounded">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-amber-700 bg-amber-500/10 px-3 py-1 rounded animate-pulse">
            Only {product.stock} left in stock
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded">
            In Stock & Ready to Ship
          </span>
        )}
      </div>

      {/* Stepper & Action button */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Quantity Stepper */}
        {!isOutOfStock && (
          <div className="flex items-center justify-between border border-amber-950/20 rounded bg-[#F5EFE6] h-14 px-4 w-full sm:w-36">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="text-amber-950/60 hover:text-amber-950 disabled:opacity-30 transition-colors p-1"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="font-mono text-sm font-bold text-amber-950">{quantity}</span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= product.stock}
              className="text-amber-950/60 hover:text-amber-950 disabled:opacity-30 transition-colors p-1"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
        )}

        {/* Add to Cart CTA Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-[#F5EFE6] h-14 px-8 text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-lg rounded-sm"
        >
          <ShoppingBag size={16} />
          <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
}
