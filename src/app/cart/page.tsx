'use client';

// Cart is user-specific — no indexing needed
export const dynamic = 'force-dynamic';


import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useCart, useCartStore } from '@/lib/store/cartStore';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const updateItemStock = useCart((state) => state.updateItemStock);
  const removeFromCart = useCart((state) => state.removeFromCart);
  const getSubtotal = useCart((state) => state.getSubtotal);

  const [validating, setValidating] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasUnavailableItems, setHasUnavailableItems] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasValidated = useRef(false);

  // Stock validation on mount: POST to check-stock with only the items in cart
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function validateStock() {
      if (!items || items.length === 0) {
        setValidating(false);
        return;
      }

      try {
        const res = await fetch('/api/products/check-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const results: any[] = data.results || [];
          const newWarnings: string[] = [];
          let anyUnavailable = false;

          results.forEach((result) => {
            // Update local stock value in Zustand store
            updateItemStock(result.productId, result.currentStock);

            if (!result.available) {
              anyUnavailable = true;
              if (result.currentStock <= 0 || !result.isActive) {
                newWarnings.push(
                  `"${result.name}" is now out of stock and has been removed from your cart.`
                );
                removeFromCart(result.productId);
              } else {
                newWarnings.push(
                  `"${result.name}" quantity was adjusted to ${result.currentStock} (limited stock).`
                );
                updateQuantity(result.productId, result.currentStock);
              }
            }
          });

          setWarnings(newWarnings);
          setHasUnavailableItems(anyUnavailable);
        }
      } catch (error) {
        console.error('Failed to validate cart stock against server:', error);
      } finally {
        setValidating(false);
      }
    }

    if (mounted && items !== undefined && !hasValidated.current) {
      hasValidated.current = true;
      validateStock();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, items]);


  // Loading state (prevents hydration flash)
  if (items === undefined || validating) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] pt-40 pb-24 flex flex-col items-center justify-center text-amber-950">
        <div className="w-8 h-8 border-4 border-[#8B3A2A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest font-bold animate-pulse">Reviewing your selection...</p>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const shippingThreshold = 999;
  const shippingCost = subtotal >= shippingThreshold ? 0 : 99;
  const total = subtotal + shippingCost;
  const missingForFreeShipping = shippingThreshold - subtotal;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] pt-32 md:pt-40 pb-24 text-amber-950">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <div className="w-20 h-20 bg-stone-200/50 rounded-full flex items-center justify-center text-stone-400 mx-auto">
            <ShoppingBag size={36} />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold">Your Cart is Empty</h1>
            <p className="text-sm font-light text-amber-950/60 leading-relaxed">
              Before you can checkout, you must add some products to your shopping cart. You will find a lot of interesting products on our shop page.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-block bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] px-8 py-3 text-xs uppercase tracking-widest font-bold transition-all rounded-sm shadow-md"
          >
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] pt-32 md:pt-40 pb-24 text-amber-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Page Title */}
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-12">
          Your <span className="italic">Shopping</span> Cart
        </h1>

        {/* Stock Warning Banners */}
        {warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 mb-8 space-y-2">
            {warnings.map((warn, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-amber-950/80 font-medium">
                <AlertTriangle size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="divide-y divide-amber-950/10">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 sm:gap-6 py-6 first:pt-0 items-start">
                  
                  {/* Image */}
                  <div className="relative w-20 h-24 bg-stone-200 rounded-md overflow-hidden flex-shrink-0 border border-amber-900/5 shadow-inner">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Meta details */}
                  <div className="flex-1 space-y-1">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-amber-950 hover:text-[#8B3A2A] transition-colors leading-snug">
                      <Link href={`/products/${item.slug}`}>
                        {item.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-amber-950/60 font-light">
                      Unit Price: ₹{item.price}
                    </p>
                    
                    {/* Line Total (Mobile only) */}
                    <p className="text-sm font-semibold text-[#8B3A2A] sm:hidden pt-1">
                      ₹{item.price * item.quantity}
                    </p>

                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center gap-4 pt-3">
                      <div className="flex items-center border border-amber-950/20 rounded bg-transparent h-9 px-2 w-28 justify-between">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="text-amber-950/60 hover:text-amber-950 p-0.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-mono text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="text-amber-950/60 hover:text-amber-950 disabled:opacity-30 p-0.5"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-amber-950/40 hover:text-red-700 p-1.5 transition-colors flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Line Total (Desktop only) */}
                  <div className="hidden sm:block text-right min-w-[80px]">
                    <span className="text-lg font-bold text-[#8B3A2A]">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>

                </div>
              ))}
            </div>

            {/* Back to Shop Link */}
            <div className="pt-6 border-t border-amber-950/10">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:text-[#8B3A2A] transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#F5EFE6]/40 border border-amber-900/5 rounded-lg p-6 space-y-6">
              <h2 className="font-serif text-lg font-bold border-b border-amber-950/10 pb-4">
                Order Summary
              </h2>

              {/* Shipping Threshold Alert */}
              {subtotal < shippingThreshold ? (
                <div className="bg-[#8B3A2A]/5 rounded p-4 border border-[#8B3A2A]/10 text-xs text-amber-950/80 leading-relaxed font-light">
                  Add <strong className="font-bold">₹{missingForFreeShipping}</strong> more to qualify for <strong className="font-bold uppercase text-[#8B3A2A]">Free Shipping</strong>!
                </div>
              ) : (
                <div className="bg-emerald-500/5 rounded p-4 border border-emerald-500/10 text-xs text-emerald-800 font-semibold tracking-wide">
                  🎉 Your order qualifies for FREE Shipping!
                </div>
              )}

              {/* Price items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-light">
                  <span className="text-amber-950/60">Subtotal:</span>
                  <span className="font-bold font-mono">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-light">
                  <span className="text-amber-950/60">Shipping Fee:</span>
                  <span className="font-bold">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-700 font-extrabold uppercase tracking-wider text-xs">Free</span>
                    ) : (
                      <span className="font-mono">₹{shippingCost}</span>
                    )}
                  </span>
                </div>
              </div>

              <hr className="border-amber-950/10" />

              {/* Total Price */}
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold uppercase tracking-wider">Estimated Total:</span>
                <span className="text-2xl font-bold text-[#8B3A2A] font-mono">₹{total}</span>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                {hasUnavailableItems ? (
                  <div className="w-full h-14 bg-stone-200 text-stone-500 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center justify-center cursor-not-allowed">
                    Update Cart to Checkout
                  </div>
                ) : (
                  <Link
                    href="/checkout"
                    className="w-full h-14 bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] text-xs font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    Proceed to Checkout
                  </Link>
                )}
                <p className="text-[10px] text-center text-amber-950/40 leading-relaxed font-light">
                  Secure checkout powered by Razorpay. Fresh products shipped with temperature-controlled cold packs.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
