'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
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

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isMegaMenuOpen, setMegaMenuOpen } = useUIStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-exponential px-6 py-4 md:px-12',
        isScrolled
          ? 'bg-warm-cream/80 backdrop-blur-md py-3 shadow-sm'
          : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Mobile Menu Trigger / Desktop Links */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setMegaMenuOpen(!isMegaMenuOpen)}
            className="p-3 -ml-3 hover:bg-henna-deep/5 rounded-full transition-colors"
            aria-label="Toggle Menu"
          >
            {isMegaMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide uppercase">
            <Link href="/shop" className="hover:text-terracotta transition-colors">Shop</Link>
            <Link href="/rituals" className="hover:text-terracotta transition-colors">Rituals</Link>
            <Link href="/about" className="hover:text-terracotta transition-colors">Our Story</Link>
          </div>
        </div>

        {/* Center: Brand Identity or Search Bar */}
        {isSearchOpen ? (
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <SearchBar onClose={() => setIsSearchOpen(false)} />
          </div>
        ) : (
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-2xl md:text-3xl font-serif tracking-tighter text-henna-deep">
              Artisanal <span className="italic">Henna</span>
            </h1>
          </Link>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="p-3 hover:bg-henna-deep/5 rounded-full transition-colors hidden sm:block"
            aria-label={isSearchOpen ? 'Close search' : 'Open search'}
            aria-expanded={isSearchOpen}
          >
            {isSearchOpen ? <X size={22} /> : <Search size={22} />}
          </button>

          <CartIcon />
        </div>
      </div>

      {/* Mega Menu Overlay (Simplified for Phase 2) */}
      {isMegaMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-warm-cream border-t border-terracotta/10 shadow-xl p-12 md:px-24 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="font-serif text-xl mb-6">Collections</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/shop/fresh-cones" className="hover:text-terracotta transition-colors">Freshly Rolled Cones</Link></li>
                <li><Link href="/shop/organic-powders" className="hover:text-terracotta transition-colors">Organic Powders</Link></li>
                <li><Link href="/shop/bridal-kits" className="hover:text-terracotta transition-colors">Bridal & Event Kits</Link></li>
                <li><Link href="/shop/herbal-care" className="hover:text-terracotta transition-colors">Herbal Self-Care</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-xl mb-6">The Ritual</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/learn/mixing" className="hover:text-terracotta transition-colors">The Art of Mixing</Link></li>
                <li><Link href="/learn/aftercare" className="hover:text-terracotta transition-colors">Aftercare Guide</Link></li>
                <li><Link href="/learn/history" className="hover:text-terracotta transition-colors">Henna Heritage</Link></li>
              </ul>
            </div>
            <div className="bg-sandstone/50 p-8 rounded-lg flex flex-col justify-center">
              <p className="font-decorative text-2xl text-terracotta mb-4">"Tradition is not the worship of ashes, but the preservation of fire."</p>
              <Link href="/about" className="text-xs uppercase tracking-widest font-bold hover:underline">Read Our Philosophy</Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Drawer and Toast */}
      <CartDrawer />
      <Toast />
    </nav>
  );
}
