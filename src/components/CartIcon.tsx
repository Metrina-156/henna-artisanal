'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart, useCartStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface CartIconProps {
  onClick?: () => void;
  isDark?: boolean;
}

export default function CartIcon({ onClick, isDark = true }: CartIconProps) {
  const { setCartOpen } = useUIStore();

  // Safe SSR reading for count
  const cartItems = useCartStore((state) => state.items);

  const cartCount = cartItems
    ? cartItems.reduce((acc, item) => acc + item.quantity, 0)
    : 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setCartOpen(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-3 hover:bg-amber-900/5 rounded-full transition-colors relative flex items-center justify-center focus:outline-none ${isDark ? 'text-amber-950' : 'text-amber-950'
        }`}
      aria-label="View Shopping Cart"
    >
      <ShoppingBag size={24} />

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.span
            key={cartCount} // Key changes force re-render, triggering the bounce animation
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.4, 0.95, 1.05, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute top-1 right-1 bg-[#8B3A2A] text-[#F5EFE6] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[#F5EFE6]"
          >
            {cartCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
