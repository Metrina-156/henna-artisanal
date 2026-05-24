export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 md:py-40">
      {/* Title Skeleton */}
      <div className="h-10 w-48 bg-stone-300/40 rounded animate-pulse mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Skeleton */}
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-4">
            <div className="h-5 w-24 bg-stone-300/40 rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-32 bg-stone-300/20 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-5 w-24 bg-stone-300/40 rounded animate-pulse" />
            <div className="h-8 w-full bg-stone-300/20 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-5 w-24 bg-stone-300/40 rounded animate-pulse" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-16 bg-stone-300/20 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid Section */}
        <div className="lg:col-span-3">
          {/* Toolbar Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="h-4 w-36 bg-stone-300/40 rounded animate-pulse" />
            <div className="h-8 w-28 bg-stone-300/40 rounded animate-pulse" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 6].map((i) => (
              <div key={i} className="space-y-4">
                {/* Image Box */}
                <div className="aspect-[4/5] bg-stone-300/40 rounded-lg animate-pulse w-full" />
                {/* Title Line */}
                <div className="h-4 w-3/4 bg-stone-300/40 rounded animate-pulse" />
                {/* Description Lines */}
                <div className="space-y-1">
                  <div className="h-3 w-full bg-stone-300/20 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-stone-300/20 rounded animate-pulse" />
                </div>
                {/* Price and Button Line */}
                <div className="flex justify-between items-center">
                  <div className="h-4 w-12 bg-stone-300/40 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-stone-300/20 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
