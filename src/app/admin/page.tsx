import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Link from 'next/link';
import { IndianRupee, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';

export default async function AdminDashboardPage() {
  await connectDB();

  // 1. Gather stats calculations
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    paidOrdersRaw,
    totalOrdersCount,
    ordersTodayCount,
    lowStockCount,
    recentOrdersRaw
  ] = await Promise.all([
    // Revenue sum of all paid orders
    Order.find({ paymentStatus: 'paid' }).select('total').lean(),
    // Total order count
    Order.countDocuments({}),
    // Orders today
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    // Active products with stock < 5
    Product.countDocuments({ isActive: true, stock: { $lt: 5 } }),
    // Last 10 orders
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
  ]);

  const totalRevenue = paidOrdersRaw.reduce((sum: number, o: any) => sum + o.total, 0);

  // Map Mongo objects to serializable plain JS objects for Next.js Server Components
  const recentOrders = recentOrdersRaw.map((order: any) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    total: order.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    date: order.createdAt.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }));

  // Define styling based on order status
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

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: <IndianRupee size={20} className="text-[#8B3A2A]" />,
      desc: 'Sum of all paid transactions',
    },
    {
      title: 'Total Orders',
      value: totalOrdersCount,
      icon: <ShoppingBag size={20} className="text-[#8B3A2A]" />,
      desc: 'Overall checkout counts',
    },
    {
      title: 'Orders Today',
      value: ordersTodayCount,
      icon: <TrendingUp size={20} className="text-[#8B3A2A]" />,
      desc: 'Checkouts processed since midnight',
    },
    {
      title: 'Low Stock Products',
      value: lowStockCount,
      icon: <AlertTriangle size={20} className={lowStockCount > 0 ? 'text-amber-600' : 'text-stone-400'} />,
      desc: 'Active products with stock < 5',
    },
  ];

  return (
    <div className="space-y-10">
      
      {/* Page Title */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">Overview</h1>
        <p className="text-xs text-stone-400 mt-1">Here's what's happening at your store today.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-stone-400">{stat.title}</span>
              <p className="text-3xl font-bold text-stone-900 font-mono leading-none">{stat.value}</p>
              <p className="text-[10px] text-stone-400 font-light">{stat.desc}</p>
            </div>
            <div className="bg-stone-50 p-3 rounded-full">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-200 flex justify-between items-center">
          <h2 className="font-serif text-lg font-bold text-stone-900">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs uppercase tracking-wider font-bold text-[#8B3A2A] hover:underline"
          >
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 text-[10px] uppercase tracking-wider font-bold">
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6 text-right">Total</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#8B3A2A]">{order.orderNumber}</td>
                    <td className="py-4 px-6 font-medium">{order.customerName}</td>
                    <td className="py-4 px-6 text-stone-500 font-light">{order.date}</td>
                    <td className="py-4 px-6 text-right font-bold font-mono">₹{order.total}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs text-[#8B3A2A] hover:underline font-bold"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400 font-light">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
