'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Check } from 'lucide-react';
import { useCart, useCartStore } from '@/lib/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast() {
  const toast = useCartStore((state) => state.toast);
  const hideToast = useCart((state) => state.hideToast);

  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast?.show, hideToast]);

  if (!toast) return null;

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, x: 10, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-24 right-6 z-50 bg-[#8B3A2A] text-[#F5EFE6] px-5 py-4 rounded-lg shadow-2xl border border-white/10 flex items-start gap-4 max-w-sm w-full"
        >
          {/* Product Thumbnail */}
          <div className="relative w-12 h-15 rounded overflow-hidden flex-shrink-0 bg-stone-200 border border-white/10 shadow-inner">
            <Image
              src={toast.image}
              alt={toast.productName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>

          {/* Information Block */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">
              <Check size={12} />
              <span>Added to Cart</span>
            </div>
            <h4 className="font-serif text-sm font-bold leading-tight line-clamp-1">
              {toast.productName}
            </h4>
            <p className="text-xs text-[#F5EFE6]/70 font-light">
              Quantity added: <span className="font-mono font-medium">{toast.quantity}</span>
            </p>
            <div className="pt-1">
              <Link
                href="/cart"
                onClick={hideToast}
                className="text-xs font-bold uppercase tracking-widest underline hover:text-white transition-colors"
              >
                View Shopping Cart
              </Link>
            </div>
          </div>

          {/* Close Action */}
          <button
            onClick={hideToast}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-[#F5EFE6]/60 hover:text-white"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
