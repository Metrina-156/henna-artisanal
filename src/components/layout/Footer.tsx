import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import NewsletterForm from '@/components/layout/NewsletterForm';

const COLLECTION_LINKS = [
  { label: 'All Products', href: '/products' },
  { label: 'Henna Cones', href: '/products?category=henna-cones' },
  { label: 'Organic Powders', href: '/products?category=organic-powders' },
  { label: 'Bridal Kits', href: '/products?category=bridal-kits' },
  { label: 'Hair Care', href: '/products?category=hair-care' },
  { label: 'Accessories', href: '/products?category=accessories' },
];

const QUICK_LINKS = [
  { label: 'Shop All Products', href: '/products' },
  { label: 'Your Cart', href: '/cart' },
  { label: 'Checkout', href: '/checkout' },
  { label: 'Search Products', href: '/search' },
];

export default function Footer() {
  return (
    <footer className="bg-[#2C1810] text-[#F5EFE6] pt-20 pb-10 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto">

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Identity */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="Artisanal Henna - Home">
              <h2 className="text-2xl font-serif tracking-tighter mb-4 hover:text-[#C9A96E] transition-colors">
                Artisanal <span className="italic">Henna</span>
              </h2>
            </Link>
            <p className="text-sm text-[#F5EFE6]/60 leading-relaxed mb-6">
              Handcrafted in small batches using traditional methods and 100% natural, organic ingredients. Rooted in ritual, designed for modern self-care.
            </p>
            <div className="flex items-center gap-2 text-[#F5EFE6]/40">
              <div className="w-6 h-px bg-[#C9A96E]/40" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Est. 2024</span>
            </div>
          </div>

          {/* Collection Links */}
          <div className="col-span-1">
            <h4 className="text-[10px] uppercase tracking-widest font-bold mb-6 text-[#F5EFE6]/40">
              Collections
            </h4>
            <ul className="space-y-3">
              {COLLECTION_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[#F5EFE6]/70 hover:text-[#C9A96E] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-[10px] uppercase tracking-widest font-bold mb-6 text-[#F5EFE6]/40">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[#F5EFE6]/70 hover:text-[#C9A96E] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-[10px] uppercase tracking-widest font-bold mb-6 text-[#F5EFE6]/40">
              Join the Circle
            </h4>
            <p className="text-sm mb-5 text-[#F5EFE6]/60 leading-relaxed">
              Receive artisanal rituals and early access to fresh drops.
            </p>
            <NewsletterForm />

            {/* CTA Button */}
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-[#8B3A2A] hover:bg-[#8B3A2A]/80 text-[#F5EFE6] text-[11px] font-bold uppercase tracking-widest rounded transition-colors w-full justify-center"
            >
              <ShoppingBag size={14} />
              Shop the Collection
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#F5EFE6]/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#F5EFE6]/30">
            © 2026 Artisanal Henna. All Rights Reserved.
          </p>

          <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest font-bold text-[#F5EFE6]/30">
            {/* Social links — external, hash anchors are acceptable here */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#C9A96E] transition-colors"
              aria-label="Instagram"
            >
              Instagram
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#C9A96E] transition-colors"
              aria-label="Pinterest"
            >
              Pinterest
            </a>
            <Link
              href="/products"
              className="hover:text-[#C9A96E] transition-colors"
            >
              Shop
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
