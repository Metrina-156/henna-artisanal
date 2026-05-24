'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ShoppingBag, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CartIcon from '@/components/CartIcon';
import CartDrawer from '@/components/CartDrawer';
import Toast from '@/components/Toast';
import SearchBar from '@/components/SearchBar';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_LINKS = [
  { label: 'Shop', href: '/products' },
  { label: 'Cart', href: '/cart' },
];

const MEGA_COLLECTIONS = [
  { label: 'All Products', href: '/products', desc: 'Browse the full collection' },
  { label: 'Henna Cones', href: '/products?category=henna-cones', desc: 'Freshly rolled, ready to use' },
  { label: 'Organic Powders', href: '/products?category=organic-powders', desc: 'Pure, lab-tested henna' },
  { label: 'Bridal Kits', href: '/products?category=bridal-kits', desc: 'Curated for special occasions' },
  { label: 'Hair Care', href: '/products?category=hair-care', desc: 'Nourishing herbal treatments' },
  { label: 'Accessories', href: '/products?category=accessories', desc: 'Cones, tools & applicators' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMegaMenuOpen, setMegaMenuOpen } = useUIStore();
  const pathname = usePathname();
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setMegaMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname, setMegaMenuOpen]);

  // Scroll detection for navbar background
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
    };
    if (isMegaMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMegaMenuOpen, setMegaMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close mega menu on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMegaMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setMegaMenuOpen]);

  const handleMegaLinkClick = () => {
    setMegaMenuOpen(false);
  };

  return (
    <>
      <nav
        ref={megaMenuRef}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-6 md:px-12',
          isScrolled || isMegaMenuOpen || isSearchOpen || pathname !== '/'
            ? 'bg-[#F5EFE6]/95 backdrop-blur-md shadow-sm py-3'
            : 'bg-transparent py-6'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Left: Menu trigger + Desktop links */}
          <div className="flex items-center gap-6">
            {/* Hamburger — triggers mega menu on desktop, mobile drawer on mobile */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileMenuOpen(true);
                  setMegaMenuOpen(false);
                } else {
                  setMegaMenuOpen(!isMegaMenuOpen);
                  if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                }
              }}
              className="p-2 -ml-2 hover:bg-amber-950/5 rounded-full transition-colors"
              aria-label={isMegaMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMegaMenuOpen}
            >
              {isMegaMenuOpen
                ? <X size={22} className="text-amber-950" />
                : <Menu size={22} className='text-amber-950' />
              }
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-5 text-xs font-bold tracking-widest uppercase">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'transition-colors hover:text-[#8B3A2A]',
                    isScrolled || isMegaMenuOpen || pathname !== '/'
                      ? 'text-amber-950'
                      : 'text-amber-950',
                    pathname === href && 'text-[#8B3A2A]'
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Center: Logo */}
          {isSearchOpen ? (
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10">
              <SearchBar onClose={() => setIsSearchOpen(false)} />
            </div>
          ) : (
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2"
              aria-label="Artisanal Henna - Home"
            >
              <span
                className={cn(
                  'text-2xl md:text-3xl font-serif tracking-tighter transition-colors',
                  'text-amber-950'
                )}
              >
                Artisanal <span className="italic">Henna</span>
              </span>
            </Link>
          )}

          {/* Right: Search + Cart */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                setMegaMenuOpen(false);
              }}
              className="p-2 hover:bg-amber-950/5 rounded-full transition-colors hidden sm:flex items-center justify-center"
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={isSearchOpen}
            >
              {isSearchOpen
                ? <X size={20} className="text-amber-950" />
                : <Search size={20} className='text-amber-950' />
              }
            </button>

            <CartIcon isDark={isScrolled || isMegaMenuOpen || pathname !== '/'} />
          </div>
        </div>

        {/* ── Desktop Mega Menu ── */}
        {isMegaMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#F5EFE6] border-t border-amber-950/10 shadow-xl py-10 px-6 md:px-12 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-w-7xl mx-auto">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-950/40 mb-6">
                Browse Collections
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {MEGA_COLLECTIONS.map(({ label, href, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleMegaLinkClick}
                    className="group p-4 rounded-lg border border-amber-950/8 hover:border-[#8B3A2A]/30 hover:bg-[#8B3A2A]/5 transition-all duration-200"
                  >
                    <span className="block text-sm font-bold text-amber-950 group-hover:text-[#8B3A2A] transition-colors">
                      {label}
                    </span>
                    <span className="block text-[11px] text-amber-950/50 mt-1 font-light leading-snug">
                      {desc}
                    </span>
                    <ChevronRight size={12} className="mt-2 text-amber-950/30 group-hover:text-[#8B3A2A] transition-colors" />
                  </Link>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-amber-950/8 flex flex-wrap items-center gap-6">
                <Link
                  href="/products"
                  onClick={handleMegaLinkClick}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8B3A2A] hover:underline"
                >
                  <ShoppingBag size={14} />
                  View All Products
                </Link>
                <Link
                  href="/cart"
                  onClick={handleMegaLinkClick}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-950/50 hover:text-amber-950 transition-colors"
                >
                  My Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={handleMegaLinkClick}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-950/50 hover:text-amber-950 transition-colors"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        )}

      </nav>

      {/* Global Drawer and Toast */}
      <CartDrawer />
      <Toast />

      {/* ── Mobile Full-Screen Menu Drawer ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-amber-950/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative ml-auto w-full max-w-sm h-full bg-[#F5EFE6] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-amber-950/10">
              <span className="text-xl font-serif tracking-tighter text-amber-950">
                Artisanal <span className="italic">Henna</span>
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-amber-950/5 rounded-full transition-colors"
                aria-label="Close mobile menu"
              >
                <X size={22} className="text-amber-950" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-950/40 mb-4">
                Navigate
              </p>
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between py-3 px-4 rounded-lg text-sm font-bold text-amber-950 hover:bg-[#8B3A2A]/5 hover:text-[#8B3A2A] transition-colors',
                  pathname === '/' && 'bg-[#8B3A2A]/8 text-[#8B3A2A]'
                )}
              >
                Home <ChevronRight size={16} className="text-amber-950/30" />
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between py-3 px-4 rounded-lg text-sm font-bold text-amber-950 hover:bg-[#8B3A2A]/5 hover:text-[#8B3A2A] transition-colors',
                  pathname === '/products' && 'bg-[#8B3A2A]/8 text-[#8B3A2A]'
                )}
              >
                Shop All Products <ChevronRight size={16} className="text-amber-950/30" />
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between py-3 px-4 rounded-lg text-sm font-bold text-amber-950 hover:bg-[#8B3A2A]/5 hover:text-[#8B3A2A] transition-colors',
                  pathname === '/cart' && 'bg-[#8B3A2A]/8 text-[#8B3A2A]'
                )}
              >
                Cart <ChevronRight size={16} className="text-amber-950/30" />
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between py-3 px-4 rounded-lg text-sm font-bold text-amber-950 hover:bg-[#8B3A2A]/5 hover:text-[#8B3A2A] transition-colors',
                  pathname === '/checkout' && 'bg-[#8B3A2A]/8 text-[#8B3A2A]'
                )}
              >
                Checkout <ChevronRight size={16} className="text-amber-950/30" />
              </Link>

              <div className="pt-6 pb-2">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-950/40 mb-4">
                  Collections
                </p>
              </div>
              {MEGA_COLLECTIONS.filter(c => c.href !== '/products').map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium text-amber-950/70 hover:bg-[#8B3A2A]/5 hover:text-[#8B3A2A] transition-colors"
                >
                  {label} <ChevronRight size={16} className="text-amber-950/20" />
                </Link>
              ))}
            </nav>

            {/* Footer CTA */}
            <div className="px-6 py-6 border-t border-amber-950/10">
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full h-12 bg-[#8B3A2A] text-[#F5EFE6] text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center"
              >
                Shop the Collection
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
