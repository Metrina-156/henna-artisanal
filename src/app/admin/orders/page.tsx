'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader2, AlertCircle, FileSpreadsheet, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

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
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Export State
  const [exporting, setExporting] = useState(false);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const url = `/api/admin/orders?page=${page}&limit=20${searchParam}${statusParam}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch orders.');
      }
      
      const data = await res.json();
      setOrders(data.orders);
      setTotalOrders(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when filter or page changes
  useEffect(() => {
    // Reset page to 1 when search query or status filter changes
    setCurrentPage(1);
    fetchOrders(1);
  }, [statusFilter]);

  // Handle manual trigger or page updates
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchOrders(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchOrders(currentPage + 1);
    }
  };

  // CSV Exporter Action
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      // Fetch all matching orders without small page limit bounds
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const url = `/api/admin/orders?limit=10000${searchParam}${statusParam}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export query failed.');
      
      const data = await res.json();
      const allMatchingOrders: Order[] = data.orders;

      if (allMatchingOrders.length === 0) {
        alert('No orders found to export.');
        return;
      }

      // Build CSV
      const headers = [
        'Order Number',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Date Placed',
        'Items Details',
        'Subtotal (INR)',
        'Shipping (INR)',
        'Total (INR)',
        'Fulfillment Status',
        'Payment Status',
        'Tracking Number',
        'Shipping Address',
        'Customer Notes',
      ];

      const csvRows = [headers.join(',')];

      allMatchingOrders.forEach((o) => {
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        const itemsStr = o.items.map((i) => `${i.name} (x${i.quantity})`).join(' | ');
        const addressStr = `${o.shippingAddress.line1}${o.shippingAddress.line2 ? ' ' + o.shippingAddress.line2 : ''}, ${o.shippingAddress.city}, ${o.shippingAddress.state} - ${o.shippingAddress.pincode}, ${o.shippingAddress.country}`;

        const rowValues = [
          o.orderNumber,
          `"${o.customer.name.replace(/"/g, '""')}"`,
          o.customer.email,
          o.customer.phone,
          dateStr,
          `"${itemsStr.replace(/"/g, '""')}"`,
          o.subtotal,
          o.shippingCost,
          o.total,
          o.status,
          o.paymentStatus,
          o.trackingNumber || '',
          `"${addressStr.replace(/"/g, '""')}"`,
          `"${(o.notes || '').replace(/"/g, '""')}"`,
        ];

        csvRows.push(rowValues.join(','));
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `orders_export_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error(err);
      alert('Failed to export orders to CSV.');
    } finally {
      setExporting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
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

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
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

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Orders Manager</h1>
          <p className="text-xs text-stone-400 mt-1">
            Track customer deliveries, update fulfillment statuses, and manage payments.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting || loading || orders.length === 0}
          className="flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <Loader2 size={16} className="animate-spin text-stone-400" />
          ) : (
            <FileSpreadsheet size={16} className="text-[#8B3A2A]" />
          )}
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 border border-stone-200 rounded-lg flex flex-col sm:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by order ID, name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] focus:bg-white transition-colors"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative w-full sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] focus:bg-white transition-colors appearance-none cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Submit trigger */}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* Main Listing Table */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-[#8B3A2A] animate-spin" />
            <p className="text-sm text-stone-400 font-light">Loading orders data...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-4">
            <div className="inline-flex p-3 bg-red-50 text-red-700 rounded-full">
              <AlertCircle size={24} />
            </div>
            <p className="text-sm text-stone-600 font-medium">{error}</p>
            <button
              onClick={() => fetchOrders(currentPage)}
              className="text-xs font-bold text-[#8B3A2A] uppercase hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-stone-400 font-light">No orders matched your search or filters.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-6">Order ID</th>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6 text-right">Total</th>
                    <th className="py-3 px-6 text-center">Fulfillment</th>
                    <th className="py-3 px-6 text-center">Payment</th>
                    <th className="py-3 px-6 text-center">Tracking</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => {
                    const formattedDate = new Date(o.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr key={o._id} className="hover:bg-stone-50/50 transition-colors">
                        {/* Order Number */}
                        <td className="py-4 px-6 font-mono font-bold text-[#8B3A2A]">{o.orderNumber}</td>

                        {/* Customer */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-stone-900">{o.customer.name}</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">{o.customer.email}</div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-stone-500 font-light">{formattedDate}</td>

                        {/* Total */}
                        <td className="py-4 px-6 text-right font-bold font-mono">
                          ₹{o.total.toLocaleString('en-IN')}
                        </td>

                        {/* Fulfillment Status */}
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getStatusStyle(o.status)}`}>
                            {o.status}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getPaymentStatusStyle(o.paymentStatus)}`}>
                            {o.paymentStatus}
                          </span>
                        </td>

                        {/* Tracking */}
                        <td className="py-4 px-6 text-center font-mono text-[11px] text-stone-500">
                          {o.trackingNumber ? o.trackingNumber : <span className="text-stone-300 italic">None</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-center">
                          <Link
                            href={`/admin/orders/${o._id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-[#8B3A2A] hover:underline font-bold"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  Showing page <span className="font-bold text-stone-900">{currentPage}</span> of <span className="font-bold text-stone-900">{totalPages}</span> ({totalOrders} orders total)
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                    className="p-1.5 border border-stone-200 rounded bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || loading}
                    className="p-1.5 border border-stone-200 rounded bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
