import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-henna-deep text-warm-cream pt-24 pb-12 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <h2 className="text-3xl font-serif mb-6 tracking-tighter">Artisanal <span className="italic">Henna</span></h2>
            <p className="text-sm text-warm-cream/70 leading-relaxed mb-8">
              Handcrafted in small batches using traditional methods and 100% natural, organic ingredients. Rooted in ritual, designed for modern self-care.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-8 opacity-50">Collection</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/shop/fresh-cones" className="hover:text-muted-gold transition-colors">Fresh Cones</Link></li>
              <li><Link href="/shop/organic-powders" className="hover:text-muted-gold transition-colors">Henna Powders</Link></li>
              <li><Link href="/shop/bridal-kits" className="hover:text-muted-gold transition-colors">Bridal Kits</Link></li>
              <li><Link href="/shop/herbal-care" className="hover:text-muted-gold transition-colors">Herbal Beauty</Link></li>
            </ul>
          </div>

          {/* Knowledge Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-8 opacity-50">Knowledge</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/rituals" className="hover:text-muted-gold transition-colors">The Rituals</Link></li>
              <li><Link href="/learn/aftercare" className="hover:text-muted-gold transition-colors">Aftercare Guide</Link></li>
              <li><Link href="/wholesale" className="hover:text-muted-gold transition-colors">Wholesale</Link></li>
              <li><Link href="/contact" className="hover:text-muted-gold transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-8 opacity-50">Join the Circle</h4>
            <p className="text-sm mb-6 opacity-80 font-decorative text-lg">Receive artisanal rituals and early access to fresh drops.</p>
            <form className="relative">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full bg-transparent border-b border-warm-cream/30 py-2 text-sm focus:outline-none focus:border-muted-gold transition-colors placeholder:text-warm-cream/30"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest font-bold hover:text-muted-gold transition-colors">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-warm-cream/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50 text-[10px] uppercase tracking-widest font-bold">
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-warm-cream transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-warm-cream transition-colors">Terms of Service</Link>
          </div>
          <p>© 2026 Artisanal Henna. All Rights Reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-warm-cream transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-warm-cream transition-colors">Pinterest</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
