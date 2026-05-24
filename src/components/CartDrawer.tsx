'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart, useCartStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen } = useUIStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Read state and actions from the cart store
  const items = useCartStore((state) => state.items) || [];
  const removeFromCart = useCart((state) => state.removeFromCart);
  const getSubtotal = useCart((state) => state.getSubtotal);
  const subtotal = getSubtotal();

  // Show the 3 most recently added or updated items (which are prepended in the items array)
  const recentItems = items.slice(0, 3);
  const hiddenItemsCount = Math.max(0, items.length - 3);

  // Close drawer on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCartOpen(false);
      }
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-stone-950/60 z-50 backdrop-blur-sm"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            ref={drawerRef}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#F5EFE6] text-amber-950 shadow-2xl z-50 flex flex-col border-l border-amber-900/10"
          >
            {/* Header */}
            <div className="p-6 border-b border-amber-950/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#8B3A2A]" />
                <h2 className="font-serif text-xl font-bold">Your Selection</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 -mr-2 hover:bg-amber-900/5 rounded-full transition-colors"
                aria-label="Close cart drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                /* Empty state */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-[#F5EFE6]/50 rounded-full flex items-center justify-center text-stone-400">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <p className="font-serif text-lg font-bold">Your cart is empty</p>
                    <p className="text-xs text-amber-950/60 mt-1 font-light max-w-[240px] mx-auto">
                      Fill it with our premium handcrafted botanical mixtures.
                    </p>
                  </div>
                  <Link
                    href="/products"
                    onClick={() => setCartOpen(false)}
                    className="bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] px-6 py-2.5 text-xs uppercase tracking-widest font-bold transition-colors rounded-sm"
                  >
                    Browse Shop
                  </Link>
                </div>
              ) : (
                /* Items List (Recent 3) */
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-950/40 mb-2">
                    Recently Added ({items.length})
                  </p>
                  <div className="divide-y divide-amber-950/5">
                    {recentItems.map((item) => (
                      <div key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-start">
                        {/* Image */}
                        <div className="relative w-16 h-20 bg-stone-200 rounded-md overflow-hidden flex-shrink-0 border border-amber-900/5">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-1">
                          <h4 className="font-serif text-sm font-bold text-amber-950 hover:text-[#8B3A2A] line-clamp-1">
                            <Link href={`/products/${item.slug}`} onClick={() => setCartOpen(false)}>
                              {item.name}
                            </Link>
                          </h4>
                          <p className="text-xs text-amber-950/60 font-light">
                            Qty: <span className="font-mono font-medium">{item.quantity}</span>
                          </p>
                          <p className="text-xs font-semibold text-[#8B3A2A]">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1 text-amber-950/40 hover:text-red-700 transition-colors"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Summary of remaining items if count > 3 */}
                  {hiddenItemsCount > 0 && (
                    <div className="text-center py-3 bg-amber-900/5 rounded text-xs text-amber-900/70 font-semibold tracking-wider uppercase">
                      + {hiddenItemsCount} more {hiddenItemsCount === 1 ? 'item' : 'items'} in your cart
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout CTAs */}
            {items.length > 0 && (
              <div className="p-6 border-t border-amber-950/10 bg-[#F5EFE6] space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase tracking-wider text-amber-950/60 font-bold">Subtotal:</span>
                  <span className="text-xl font-bold text-[#8B3A2A]">₹{subtotal}</span>
                </div>
                
                <p className="text-[10px] text-amber-950/50 leading-relaxed font-light">
                  Shipping, taxes, and discounts will be calculated at checkout.
                </p>

                <div className="space-y-2 pt-2">
                  <Link
                    href="/cart"
                    onClick={() => setCartOpen(false)}
                    className="w-full h-12 bg-transparent hover:bg-amber-950/5 border border-amber-950 text-amber-950 text-xs font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center"
                  >
                    View Shopping Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="w-full h-12 bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] text-xs font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center shadow"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
