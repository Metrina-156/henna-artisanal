'use client';

// Checkout is a transactional page — force dynamic, no indexing
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { useCart, useCartStore } from '@/lib/store/cartStore';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

interface FormFields {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  shippingMethod: 'standard' | 'express';
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  // 1. Zustand store subscriptions
  const items = useCartStore((state) => state.items);
  const getSubtotal = useCart((state) => state.getSubtotal);
  
  // Mounted rehydration check to verify cart isn't empty before showing checkout
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormFields>({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    shippingMethod: 'standard',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setMounted(true);
    // Dynamically load Razorpay SDK on mount
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Redirect to cart if empty, but ONLY after rehydration mount check
  useEffect(() => {
    if (mounted && (!items || items.length === 0)) {
      router.push('/cart');
    }
  }, [mounted, items, router]);

  if (!mounted || !items || items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] pt-40 pb-24 flex flex-col items-center justify-center text-amber-950">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B3A2A] mb-4" />
        <p className="text-xs uppercase tracking-widest font-bold animate-pulse">Initializing Checkout...</p>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const shippingThreshold = 999;
  
  // Calculate shipping cost based on subtotal and shippingMethod selection
  let shippingCost = 99; // standard default
  if (formData.shippingMethod === 'express') {
    shippingCost = 199;
  } else if (formData.shippingMethod === 'standard' && subtotal >= shippingThreshold) {
    shippingCost = 0;
  }
  
  const total = subtotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error dynamically
    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    // Name Check
    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }

    // Email Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    // Phone Check (10-digit Indian mobile number check)
    const cleanPhone = formData.phone.replace(/[\s\-]/g, '');
    const phoneRegex = /^\d{10}$/;
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(cleanPhone)) {
      nextErrors.phone = 'Please enter a valid 10-digit phone number.';
    }

    // Address Line 1 Check
    if (!formData.line1.trim()) {
      nextErrors.line1 = 'Shipping address is required.';
    }

    // City Check
    if (!formData.city.trim()) {
      nextErrors.city = 'City is required.';
    }

    // State Check
    if (!formData.state) {
      nextErrors.state = 'Please select a state.';
    }

    // Pincode Check (6-digit Indian postal code check)
    const pinRegex = /^\d{6}$/;
    if (!formData.pincode.trim()) {
      nextErrors.pincode = 'Pincode is required.';
    } else if (!pinRegex.test(formData.pincode)) {
      nextErrors.pincode = 'Please enter a valid 6-digit postal code (pincode).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verify Razorpay SDK is loaded
      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        const loadScript = () => new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
        const loaded = await loadScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
        }
      }

      // Map cart items for database check
      const cartItemsInput = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      // Call API to create a Razorpay checkout order
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItemsInput,
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone.replace(/[\s\-]/g, ''),
            notes: formData.notes,
          },
          shippingAddress: {
            line1: formData.line1,
            line2: formData.line2,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: 'India',
          },
          shippingMethod: formData.shippingMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout order initiation failed.');
      }

      // Trigger Razorpay payment modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: data.amount,
        currency: data.currency,
        name: 'Henna Artisanal',
        description: `Payment for Order #${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        handler: async function (paymentResponse: any) {
          try {
            setIsSubmitting(true);
            const verifyResponse = await fetch('/api/checkout/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment verification failed.');
            }

            // Redirect to success page on successful verification with guestToken authorization
            router.push(`/order/success?order_id=${paymentResponse.razorpay_order_id}&token=${verifyData.guestToken}`);
          } catch (err: any) {
            console.error('Payment Verification Error:', err);
            setSubmitError(err.message || 'Payment succeeded, but signature verification failed. Please contact support.');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone.replace(/[\s\-]/g, ''),
        },
        theme: {
          color: '#8B3A2A',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Checkout Error:', error);
      setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5EFE6] pt-32 md:pt-40 pb-24 text-amber-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:text-[#8B3A2A] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Shopping Cart</span>
          </Link>
        </div>

        {/* Page Title */}
        <h1 className="font-serif text-3xl md:text-5xl font-bold mb-12">Checkout</h1>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-800 text-xs font-semibold rounded p-4 mb-8">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold border-b border-amber-950/10 pb-3">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-[#F5EFE6]/50 border rounded px-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] ${
                      errors.name ? 'border-red-500' : 'border-amber-950/20'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-red-600 font-medium">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-[#F5EFE6]/50 border rounded px-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] ${
                      errors.email ? 'border-red-500' : 'border-amber-950/20'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-red-600 font-medium">{errors.email}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="phone">Phone Number (10-Digit) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-sm text-amber-950/40 font-mono">+91</span>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full bg-[#F5EFE6]/50 border rounded pl-14 pr-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] font-mono ${
                        errors.phone ? 'border-red-500' : 'border-amber-950/20'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-red-600 font-medium">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold border-b border-amber-950/10 pb-3">Shipping Address</h2>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="line1">Address Line 1 *</label>
                  <input
                    type="text"
                    id="line1"
                    name="line1"
                    placeholder="Flat, House no., Building, Company, Apartment"
                    value={formData.line1}
                    onChange={handleInputChange}
                    className={`w-full bg-[#F5EFE6]/50 border rounded px-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] ${
                      errors.line1 ? 'border-red-500' : 'border-amber-950/20'
                    }`}
                  />
                  {errors.line1 && <p className="text-[11px] text-red-600 font-medium">{errors.line1}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="line2">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    id="line2"
                    name="line2"
                    placeholder="Area, Street, Sector, Village"
                    value={formData.line2}
                    onChange={handleInputChange}
                    className="w-full bg-[#F5EFE6]/50 border border-amber-950/20 rounded px-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="city">City / Town *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full bg-[#F5EFE6]/50 border rounded px-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] ${
                        errors.city ? 'border-red-500' : 'border-amber-950/20'
                      }`}
                    />
                    {errors.city && <p className="text-[11px] text-red-600 font-medium">{errors.city}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="state">State *</label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full bg-[#F5EFE6]/50 border rounded px-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] ${
                        errors.state ? 'border-red-500' : 'border-amber-950/20'
                      }`}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-[11px] text-red-600 font-medium">{errors.state}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-bold text-amber-950/60" htmlFor="pincode">Pincode (6-Digit) *</label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      placeholder="110001"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className={`w-full bg-[#F5EFE6]/50 border rounded px-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] font-mono ${
                        errors.pincode ? 'border-red-500' : 'border-amber-950/20'
                      }`}
                    />
                    {errors.pincode && <p className="text-[11px] text-red-600 font-medium">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold border-b border-amber-950/10 pb-3">Shipping Method</h2>
              <div className="space-y-4">
                {/* Standard */}
                <label className={`flex justify-between items-center p-4 border rounded cursor-pointer transition-all ${
                  formData.shippingMethod === 'standard'
                    ? 'border-[#8B3A2A] bg-[#8B3A2A]/5'
                    : 'border-amber-950/20 hover:bg-amber-900/5'
                }`}>
                  <div className="flex gap-3 items-start">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={formData.shippingMethod === 'standard'}
                      onChange={handleInputChange}
                      className="mt-1 accent-[#8B3A2A]"
                    />
                    <div>
                      <p className="text-sm font-bold">Standard Delivery</p>
                      <p className="text-xs text-amber-950/60 font-light mt-0.5">Delivery in 5-7 business days. Temperature-stabilized packaging.</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">
                    {subtotal >= shippingThreshold ? (
                      <span className="text-emerald-700 font-extrabold uppercase text-xs tracking-wider">Free</span>
                    ) : (
                      '₹99'
                    )}
                  </span>
                </label>

                {/* Express */}
                <label className={`flex justify-between items-center p-4 border rounded cursor-pointer transition-all ${
                  formData.shippingMethod === 'express'
                    ? 'border-[#8B3A2A] bg-[#8B3A2A]/5'
                    : 'border-amber-950/20 hover:bg-amber-900/5'
                }`}>
                  <div className="flex gap-3 items-start">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={formData.shippingMethod === 'express'}
                      onChange={handleInputChange}
                      className="mt-1 accent-[#8B3A2A]"
                    />
                    <div>
                      <p className="text-sm font-bold">Express Delivery</p>
                      <p className="text-xs text-amber-950/60 font-light mt-0.5">Priority shipping in 2-3 business days. Fresh cold packs included.</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">₹199</span>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold border-b border-amber-950/10 pb-3">Order Notes (Optional)</h2>
              <div className="space-y-1.5">
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Notes about your order, e.g. special instructions for delivery or custom mix preferences."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full bg-[#F5EFE6]/50 border border-amber-950/20 rounded p-4 text-sm focus:outline-none focus:border-[#8B3A2A]"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#F5EFE6]/40 border border-amber-900/5 rounded-lg p-6 space-y-6">
              <h2 className="font-serif text-xl font-bold border-b border-amber-950/10 pb-4">Order Summary</h2>
              
              {/* Product List */}
              <div className="divide-y divide-amber-950/5 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-950/10">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-start">
                    <div className="relative w-12 h-15 rounded overflow-hidden flex-shrink-0 bg-stone-200 border border-amber-900/5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="font-serif text-sm font-bold line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-amber-950/60 font-light">
                        Qty: <span className="font-mono">{item.quantity}</span> × ₹{item.price}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#8B3A2A] font-mono">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="border-amber-950/10" />

              {/* Aggregated sums */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-light">
                  <span className="text-amber-950/60">Subtotal:</span>
                  <span className="font-bold font-mono">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-light">
                  <span className="text-amber-950/60">Shipping:</span>
                  <span className="font-bold">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-700 font-extrabold uppercase text-xs tracking-wider">Free</span>
                    ) : (
                      <span className="font-mono">₹{shippingCost}</span>
                    )}
                  </span>
                </div>
              </div>

              <hr className="border-amber-950/10" />

              {/* Total estimation */}
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold uppercase tracking-wider">Total Due:</span>
                <span className="text-2xl font-bold text-[#8B3A2A] font-mono">₹{total}</span>
              </div>

              {/* Checkout Trigger */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-[#F5EFE6] text-xs font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-3 shadow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Initiating Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Pay Now ₹{total}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-amber-950/40 text-center leading-relaxed font-light">
                By placing this order you agree to our terms. Your transaction is encrypted and secured by Razorpay.
              </p>

            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
