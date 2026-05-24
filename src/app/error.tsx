'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F5EFE6] flex items-center justify-center px-6 text-amber-950">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Icon */}
        <div className="space-y-4">
          <p className="text-[100px] leading-none text-[#8B3A2A]/10 font-serif select-none" aria-hidden="true">
            ✿
          </p>
          <div className="-mt-12 space-y-2">
            <span className="text-xs uppercase tracking-[0.35em] font-bold text-[#8B3A2A] block">
              Something went wrong
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
              Unexpected <span className="italic">Error</span>
            </h1>
          </div>
        </div>

        <p className="text-sm font-light text-amber-950/60 leading-relaxed max-w-sm mx-auto">
          An unexpected error interrupted your experience. Our team has been
          notified. Please try again or return to the homepage.
        </p>

        {/* Error digest for debugging — hidden in production */}
        {process.env.NODE_ENV === 'development' && error?.message && (
          <p className="text-[10px] font-mono bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded text-left break-all">
            {error.message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-block bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] px-8 py-3.5 text-xs uppercase tracking-widest font-bold transition-all rounded-sm shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-block border border-amber-950/20 hover:border-[#8B3A2A] text-amber-950 hover:text-[#8B3A2A] px-8 py-3.5 text-xs uppercase tracking-widest font-bold transition-all rounded-sm"
          >
            Return Home
          </Link>
        </div>

      </div>
    </main>
  );
}
