'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.ok ? await res.json() : null;

      if (res.ok && data?.success) {
        router.push(redirectPath);
        router.refresh(); // Force page refresh to update middleware state
      } else {
        const errorData = res.status !== 200 ? await res.json() : { error: 'Invalid login credentials.' };
        setError(errorData.error || 'Invalid credentials or unauthorized access.');
      }
    } catch (err) {
      console.error('Authentication request failed:', err);
      setError('A network error occurred. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 flex items-center justify-center p-6 text-stone-900">
      <div className="w-full max-w-md bg-white border border-stone-200 shadow-xl rounded-lg p-8 space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#8B3A2A]">
            Artisanal <span className="italic">Henna</span>
          </h1>
          <p className="text-xs uppercase tracking-widest font-bold text-stone-400">
            Administrative Access
          </p>
        </div>

        {/* Error alert banner */}
        {error && (
          <div className="bg-red-50/50 border border-red-200 text-red-800 text-xs rounded p-4 flex gap-2.5 items-start">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-bold text-stone-500" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-stone-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  id="email"
                  placeholder="admin@henna.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded pl-11 pr-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-bold text-stone-500" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-stone-400">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded pl-11 pr-4 h-12 text-sm focus:outline-none focus:border-[#8B3A2A] focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-[#F5EFE6] text-xs font-bold uppercase tracking-widest transition-all rounded shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-wider font-semibold"
          >
            Return to Store
          </Link>
        </div>

      </div>
    </main>
  );
}
