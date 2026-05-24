import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F5EFE6] flex items-center justify-center px-6 text-amber-950">
      <div className="max-w-lg w-full text-center space-y-10">

        {/* Decorative mehndi motif */}
        <div className="space-y-4">
          <p className="text-[120px] leading-none text-[#8B3A2A]/10 font-serif select-none" aria-hidden="true">
            ❋
          </p>
          <div className="-mt-16 space-y-2">
            <span className="text-xs uppercase tracking-[0.35em] font-bold text-[#8B3A2A] block">
              404 — Lost in the Pattern
            </span>
            <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight">
              Page Not <span className="italic">Found</span>
            </h1>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm font-light text-amber-950/60 leading-relaxed max-w-sm mx-auto">
          Like an unfinished mehndi design, this page seems to be missing.
          It may have been moved, removed, or never existed. Let&apos;s guide
          you back to something beautiful.
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 justify-center">
          <span className="h-px flex-1 bg-amber-950/10 max-w-[80px]" />
          <span className="text-[#8B3A2A] text-lg" aria-hidden="true">✦</span>
          <span className="h-px flex-1 bg-amber-950/10 max-w-[80px]" />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-block bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] px-8 py-3.5 text-xs uppercase tracking-widest font-bold transition-all rounded-sm shadow-md hover:shadow-lg"
          >
            Return Home
          </Link>
          <Link
            href="/products"
            className="inline-block border border-amber-950/20 hover:border-[#8B3A2A] text-amber-950 hover:text-[#8B3A2A] px-8 py-3.5 text-xs uppercase tracking-widest font-bold transition-all rounded-sm"
          >
            Shop Collection
          </Link>
        </div>

      </div>
    </main>
  );
}
