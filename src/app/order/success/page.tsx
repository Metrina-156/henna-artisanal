'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Package, ArrowRight, Home, Calendar, Truck } from 'lucide-react';
import { useCart } from '@/lib/store/cartStore';

// Loading Fallback Component
function SuccessLoading() {
  return (
    <div className="min-h-screen bg-[#F5EFE6] pt-40 pb-24 flex flex-col items-center justify-center text-amber-950">
      <div className="w-8 h-8 border-4 border-[#8B3A2A] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs uppercase tracking-widest font-bold animate-pulse">Locating your order receipt...</p>
    </div>
  );
}

// Internal Content Component that consumes SearchParams inside Suspense
function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCart((state) => state.clearCart);

  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const cartClearedRef = useRef(false);

  // 1. Fetch order details from the database using Stripe Session ID
  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/by-session/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          // Redirect if order not found
          router.push('/');
        }
      } catch (err) {
        console.error('Failed to resolve order details:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [sessionId, router]);

  // 2. Perform one-time cart clearing upon successful order confirmation loading
  useEffect(() => {
    if (order && !cartClearedRef.current) {
      clearCart();
      cartClearedRef.current = true;
      console.log('Cart cleared successfully for order:', order.orderNumber);
    }
  }, [order, clearCart]);

  if (loading || !order) {
    return <SuccessLoading />;
  }

  // Calculate estimated delivery dates
  const orderDate = new Date(order.createdAt);
  const minDelivery = new Date(orderDate);
  const maxDelivery = new Date(orderDate);

  // Standard (5-7 business days) or Express (2-3 business days)
  const isExpress = order.shippingCost > 0 && order.shippingCost <= 199 && order.total - order.subtotal === 199; 
  // Let's check metadata or shipping cost. In our create-session standard is ₹99 or free (0), express is ₹199.
  const isExpressDelivery = order.shippingCost === 199;

  if (isExpressDelivery) {
    minDelivery.setDate(orderDate.getDate() + 2);
    maxDelivery.setDate(orderDate.getDate() + 3);
  } else {
    minDelivery.setDate(orderDate.getDate() + 5);
    maxDelivery.setDate(orderDate.getDate() + 7);
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-amber-950">
      
      {/* Visual Header */}
      <div className="text-center space-y-4 mb-16">
        <MotionDivFallback>
          <CheckCircle className="w-16 h-16 text-[#8B3A2A] mx-auto animate-bounce" />
        </MotionDivFallback>
        <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#8B3A2A] block">Payment Received</span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold">
          Thank you, <span className="italic">{order.customer.name.split(' ')[0]}</span>!
        </h1>
        <p className="text-sm font-light text-amber-950/60 leading-relaxed max-w-md mx-auto">
          Your order has been confirmed. A confirmation receipt detailing shipping coordinates and care steps has been dispatched to your email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-12">
        {/* Receipt Block (Left) */}
        <div className="bg-[#F5EFE6]/40 border border-amber-900/5 rounded-lg p-6 space-y-6">
          <h2 className="font-serif text-lg font-bold border-b border-amber-950/10 pb-3 flex items-center gap-2">
            <Package size={18} className="text-[#8B3A2A]" />
            Order Details
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-950/60 font-bold">Order Number</p>
              <p className="font-mono text-sm font-bold pt-0.5 text-[#8B3A2A]">{order.orderNumber}</p>
            </div>

            {/* Estimated Delivery */}
            <div className="flex gap-3 items-start bg-amber-900/5 p-3 rounded">
              <Calendar size={18} className="text-[#8B3A2A] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-950/60 font-bold">Estimated Delivery</p>
                <p className="text-xs font-semibold pt-0.5">
                  {formatDate(minDelivery)} – {formatDate(maxDelivery)}
                </p>
                <p className="text-[10px] text-amber-950/50 mt-0.5 font-light">
                  {isExpressDelivery ? 'Express Air Cargo Delivery' : 'Standard Temperature-Controlled Cold Transit'}
                </p>
              </div>
            </div>
            
            {/* Products summary list */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-amber-950/60 font-bold">Items Purchased</p>
              <div className="divide-y divide-amber-950/5 max-h-52 overflow-y-auto pr-1">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 py-3 first:pt-0 last:pb-0 items-center">
                    <div className="relative w-8 h-10 rounded overflow-hidden flex-shrink-0 bg-stone-200">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-amber-950/60 font-light font-mono">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-amber-950/10" />

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-amber-950/60 font-medium uppercase tracking-wider">Total Paid:</span>
              <span className="text-base font-bold text-[#8B3A2A] font-mono">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Shipping Block (Right) */}
        <div className="bg-[#F5EFE6]/40 border border-amber-900/5 rounded-lg p-6 space-y-6">
          <h2 className="font-serif text-lg font-bold border-b border-amber-950/10 pb-3 flex items-center gap-2">
            <Truck size={18} className="text-[#8B3A2A]" />
            Shipping Coordinates
          </h2>

          <div className="space-y-4 text-xs font-light">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-950/60 font-bold mb-1">Customer Details</p>
              <p className="font-semibold">{order.customer.name}</p>
              <p className="text-amber-950/60 pt-0.5">{order.customer.email}</p>
              <p className="text-amber-950/60 pt-0.5 font-mono">+91 {order.customer.phone}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-950/60 font-bold mb-1">Shipping Address</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p className="pt-0.5">{order.shippingAddress.line2}</p>}
              <p className="pt-0.5">
                {order.shippingAddress.city}, {order.shippingAddress.state} – <span className="font-mono font-semibold">{order.shippingAddress.pincode}</span>
              </p>
              <p className="pt-0.5 font-semibold text-amber-950/60">{order.shippingAddress.country}</p>
            </div>

            {order.notes && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-950/60 font-bold mb-1">Instructions</p>
                <p className="italic bg-amber-900/5 p-2.5 rounded text-amber-950/80 leading-relaxed font-light">
                  "{order.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8 border-t border-amber-950/10">
        <Link
          href="/products"
          className="w-full sm:w-auto h-12 bg-transparent hover:bg-amber-950/5 border border-amber-950 text-amber-950 text-xs font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center px-8"
        >
          <Home size={14} className="mr-2" />
          <span>Continue Shopping</span>
        </Link>
        <button
          onClick={() => alert(`Tracking updates for order ${order.orderNumber} will be sent to +91 ${order.customer.phone}.`)}
          className="w-full sm:w-auto h-12 bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] text-xs font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center px-8 shadow"
        >
          <span>Track Order</span>
          <ArrowRight size={14} className="ml-2" />
        </button>
      </div>

    </div>
  );
}

// Fallback div rendering (removes pure framer-motion peer dependencies checks)
function MotionDivFallback({ children }: { children: React.ReactNode }) {
  return <div className="transform hover:scale-105 transition-transform duration-300">{children}</div>;
}

// Primary Export wrapping Success content in Suspense
export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-[#F5EFE6] pt-32 md:pt-40 pb-24">
      <Suspense fallback={<SuccessLoading />}>
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}
