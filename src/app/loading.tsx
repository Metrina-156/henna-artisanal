export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F5EFE6] flex flex-col items-center justify-center gap-6 text-amber-950">
      {/* Spinning henna-coloured ring */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#8B3A2A]/10" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#8B3A2A] animate-spin" />
        {/* Inner decorative dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#8B3A2A]/40 text-lg" aria-hidden="true">❋</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#8B3A2A] animate-pulse">
          Loading
        </p>
        <p className="text-[10px] uppercase tracking-widest text-amber-950/30 font-medium">
          Artisanal Henna
        </p>
      </div>
    </div>
  );
}
