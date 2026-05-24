/**
 * Admin-specific loading state.
 * Scoped to /app/admin/ so it overrides the global loading.tsx for all admin routes.
 * Matches the admin dashboard's minimal white/gray aesthetic.
 */
export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-stone-500">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-[#8B3A2A] rounded-full animate-spin" />
      <p className="text-xs uppercase tracking-widest font-bold text-stone-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
}
