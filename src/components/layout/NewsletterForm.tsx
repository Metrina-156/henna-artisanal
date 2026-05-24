'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Placeholder: replace with real newsletter API call
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="text-sm text-[#C9A96E] font-medium py-3">
        ✓ You're on the list! Welcome to the circle.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Newsletter signup">
      <div className="flex items-center border border-[#F5EFE6]/20 rounded overflow-hidden focus-within:border-[#C9A96E]/60 transition-colors">
        <Mail size={14} className="ml-3 text-[#F5EFE6]/30 flex-shrink-0" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="flex-1 bg-transparent py-3 px-3 text-sm focus:outline-none placeholder:text-[#F5EFE6]/30 text-[#F5EFE6]"
          aria-label="Email address for newsletter"
        />
        <button
          type="submit"
          className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-[#2C1810] bg-[#C9A96E] hover:bg-[#F5EFE6] transition-colors flex-shrink-0"
        >
          Join
        </button>
      </div>
    </form>
  );
}
