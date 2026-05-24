'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Truck, CreditCard, Clock, Check } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: Customer;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  stripeSessionId: string;
  stripePaymentIntentId: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // States
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [status, setStatus] = useState<string>('pending');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Refund states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Order not found.');
        throw new Error('Failed to load order details.');
      }
      const data: Order = await res.json();
      setOrder(data);
      setStatus(data.status);
      setTrackingNumber(data.trackingNumber || '');
      setNotes(data.notes || '');
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess(false);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber.trim(),
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update order details.');
      }

      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update order.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTriggerRefund = async () => {
    setRefunding(true);
    setRefundError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}/refund`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Refund transaction rejected.');
      }

      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      setStatus('refunded');
      setShowRefundModal(false);
    } catch (err: any) {
      console.error(err);
      setRefundError(err.message || 'Stripe Refund Request failed.');
    } finally {
      setRefunding(false);
    }
  };

  const formatAddress = (addr?: ShippingAddress) => {
    if (!addr) return '';
    return `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
  };

  const getStatusStyle = (statusName: string) => {
    switch (statusName) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'shipped':
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pending':
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const getPaymentStatusStyle = (statusName: string) => {
    switch (statusName) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'refunded':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
      default:
        return 'bg-stone-50 text-stone-500 border-stone-200';
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#8B3A2A] animate-spin" />
        <p className="text-sm text-stone-400 font-light">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-flex p-3 bg-red-50 text-red-700 rounded-full">
          <AlertCircle size={24} />
        </div>
        <p className="text-sm text-stone-600 font-medium">{error || 'Order could not be loaded.'}</p>
        <button
          onClick={() => router.push('/admin/orders')}
          className="text-xs font-bold text-[#8B3A2A] uppercase hover:underline flex items-center gap-1 mx-auto"
        >
          <ArrowLeft size={12} />
          <span>Back to Orders</span>
        </button>
      </div>
    );
  }

  // Timeline logic
  const isStepDone = (stepStatus: string) => {
    const sequence = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIdx = sequence.indexOf(order.status);
    const stepIdx = sequence.indexOf(stepStatus);
    
    if (order.status === 'cancelled' || order.status === 'refunded') {
      return false; // Show alternative timeline behavior if cancelled
    }
    return stepIdx <= currentIdx;
  };

  const timelineSteps = [
    { key: 'pending', title: 'Order Placed', desc: 'Order received and awaiting confirmation', icon: <Clock size={16} /> },
    { key: 'confirmed', title: 'Confirmed', desc: 'Stock allocated and order approved', icon: <CheckCircle2 size={16} /> },
    { key: 'processing', title: 'Processing', desc: 'Items are being packed and labeled', icon: <Loader2 size={16} /> },
    { key: 'shipped', title: 'Shipped', desc: `Handed to courier. Tracking: ${order.trackingNumber || 'Pending'}`, icon: <Truck size={16} /> },
    { key: 'delivered', title: 'Delivered', desc: 'Order reached customer successfully', icon: <Check size={16} /> },
  ];

  return (
    <div className="space-y-8">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/orders')}
            className="p-2 border border-stone-200 rounded-md bg-white hover:bg-stone-50 transition-colors text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl font-bold text-stone-900">{order.orderNumber}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusStyle(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-3">
          {order.paymentStatus === 'paid' && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              Refund Order
            </button>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Items, Receipts & Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Ordered Items List */}
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 bg-stone-50 px-6 py-4 border-b border-stone-200">
              Ordered Items
            </h2>

            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.productId} className="p-6 flex items-center justify-between gap-6 hover:bg-stone-50/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900">{item.name}</h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-stone-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal summary section */}
            <div className="bg-stone-50 border-t border-stone-200 p-6 space-y-2">
              <div className="flex justify-between text-xs text-stone-500 font-light">
                <span>Subtotal</span>
                <span className="font-mono font-medium">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-500 font-light">
                <span>Shipping cost</span>
                <span className="font-mono font-medium">₹{order.shippingCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-2 mt-2">
                <span>Grand Total</span>
                <span className="font-mono text-base text-[#8B3A2A]">
                  ₹{order.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Management Actions */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2 mb-4">
              Fulfillment & Admin Actions
            </h2>

            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Status selector */}
                <div className="space-y-1">
                  <label htmlFor="status" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Order Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] bg-white cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Tracking Code */}
                <div className="space-y-1">
                  <label htmlFor="tracking" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Tracking Number
                  </label>
                  <input
                    id="tracking"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DTDC-IN-934898"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label htmlFor="notes" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Order / Customer Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about customization requests, delivery modifications, or comments..."
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] font-light"
                />
              </div>

              {/* Success Notification */}
              {updateSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-2.5 rounded flex items-center gap-2">
                  <span>Order updated successfully!</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {updating && <Loader2 size={12} className="animate-spin" />}
                <span>Save Order Settings</span>
              </button>

            </form>
          </div>
        </div>

        {/* Right Column: Customer Details, Address, Timeline */}
        <div className="space-y-6">
          
          {/* Card: Customer Information */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Customer Information
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Full Name</span>
                <span className="text-stone-900 font-semibold">{order.customer.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Email Address</span>
                <a href={`mailto:${order.customer.email}`} className="text-[#8B3A2A] hover:underline font-light">
                  {order.customer.email}
                </a>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Phone number</span>
                <span className="text-stone-900 font-mono font-light">{order.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Card: Shipping Address */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Shipping Address
            </h2>
            <div className="text-sm font-light text-stone-700 leading-relaxed">
              <p className="font-semibold text-stone-900">{order.customer.name}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
              <p className="font-medium text-stone-500 mt-1">{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Card: Payment Details */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Payment Transactions
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-light">Payment Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPaymentStatusStyle(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="border-t border-stone-100 pt-2 space-y-1">
                <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Stripe Transaction ID</span>
                <span className="text-[10px] font-mono text-stone-600 block break-all bg-stone-50 p-1.5 border border-stone-100 rounded">
                  {order.stripePaymentIntentId}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Progress Timeline */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Fulfillment Timeline
            </h2>

            {/* Vertical timeline visual */}
            {order.status === 'cancelled' || order.status === 'refunded' ? (
              <div className="flex items-start gap-4 py-2">
                <div className="p-2 rounded-full bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-700 capitalize">Order {order.status}</h4>
                  <p className="text-[11px] text-stone-400 font-light mt-0.5">
                    Action logged on {new Date(order.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-stone-200 ml-3 space-y-6 py-2">
                {timelineSteps.map((step) => {
                  const done = isStepDone(step.key);
                  const isCurrent = order.status === step.key;

                  return (
                    <div key={step.key} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-0 p-1 rounded-full border text-white transition-colors ${
                        done 
                          ? 'bg-[#8B3A2A] border-[#8B3A2A]' 
                          : isCurrent 
                            ? 'bg-amber-500 border-amber-500' 
                            : 'bg-white text-stone-400 border-stone-200'
                      }`}>
                        {step.icon}
                      </span>
                      
                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-bold ${done ? 'text-stone-900' : 'text-stone-400'}`}>
                          {step.title}
                        </h4>
                        <p className="text-[10px] text-stone-400 font-light leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Stripe Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-serif text-lg font-bold text-stone-950">Refund Stripe Payment?</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                This will trigger a full refund of <span className="font-bold text-stone-900">₹{order.total.toLocaleString('en-IN')}</span> through Stripe back to the customer's payment method. This cannot be reversed.
              </p>

              {refundError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-xs text-red-700 flex items-center gap-1.5">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{refundError}</span>
                </div>
              )}
            </div>
            <div className="bg-stone-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                disabled={refunding}
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundError(null);
                }}
                className="px-4 py-2 bg-white border border-stone-200 rounded text-xs font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={refunding}
                onClick={handleTriggerRefund}
                className="px-4 py-2 bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-red-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {refunding && <Loader2 size={12} className="animate-spin" />}
                <span>Confirm Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
