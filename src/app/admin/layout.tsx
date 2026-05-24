'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Package, ExternalLink, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

function SidebarLink({ href, label, icon, active }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold tracking-wide uppercase transition-colors ${
        active
          ? 'bg-[#8B3A2A]/5 text-[#8B3A2A]'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // If path is login, do not show layout navigation shells
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/admin/login');
        router.refresh(); // Refresh state
      } else {
        console.error('Logout failed.');
        setLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-stone-200 flex flex-col flex-shrink-0">
        {/* Branding header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <Link href="/admin">
            <h1 className="font-serif text-xl font-bold tracking-tight text-[#8B3A2A]">
              Artisanal <span className="italic">Henna</span>
            </h1>
            <p className="text-[9px] uppercase tracking-widest font-bold text-stone-400 mt-0.5">
              Admin Dashboard
            </p>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-6 space-y-2">
          <SidebarLink
            href="/admin"
            label="Dashboard"
            icon={<LayoutDashboard size={18} />}
            active={pathname === '/admin'}
          />
          <SidebarLink
            href="/admin/products"
            label="Products"
            // Wait, lucide-react uses "Tag" for tags, and "Package" is nice. Let's use Package for products, and layout dashboard.
            icon={<Package size={18} />}
            active={pathname.startsWith('/admin/products')}
          />
          <SidebarLink
            href="/admin/orders"
            label="Orders"
            icon={<ShoppingBag size={18} />}
            active={pathname.startsWith('/admin/orders')}
          />
        </nav>

        {/* Return to store portal */}
        <div className="p-6 border-t border-stone-200 space-y-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <span>View Store</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header navbar */}
        <header className="h-16 bg-white border-b border-stone-200 px-6 md:px-12 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">
            {pathname === '/admin' ? 'Overview' : pathname.startsWith('/admin/products') ? 'Products Portal' : 'Orders Portal'}
          </h2>

          {/* Action button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-stone-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            <span>Sign Out</span>
          </button>
        </header>

        {/* Scrollable Children Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          {children}
        </main>
      </div>

    </div>
  );
}
