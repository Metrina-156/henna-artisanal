import { Metadata } from 'next';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

// Search results should never be indexed
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  return {
    title: query ? `Search results for "${query}"` : 'Search',
    description: query
      ? `Shop Artisanal Henna products matching "${query}" — organic cones, powders, kits, and more.`
      : 'Search the Artisanal Henna collection.',
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  let products: any[] = [];
  let total = 0;

  if (query) {
    await connectDB();

    const dbQuery = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    };

    const [productsRaw, totalCount] = await Promise.all([
      Product.find(dbQuery).sort({ isFeatured: -1, createdAt: -1 }).limit(24).lean(),
      Product.countDocuments(dbQuery),
    ]);

    total = totalCount;
    products = productsRaw.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  const suggestions = ['henna cones', 'organic powder', 'bridal kit', 'hair mask', 'accessories'];

  return (
    <main className="min-h-screen bg-[#F5EFE6] pt-32 md:pt-40 pb-24 text-amber-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="border-b border-amber-950/10 pb-8 mb-12">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-[#8B3A2A] mb-3 block">
            Search Results
          </span>
          {query ? (
            <>
              <h1 className="text-4xl md:text-5xl font-serif leading-tight">
                Results for <span className="italic">&ldquo;{query}&rdquo;</span>
              </h1>
              <p className="text-sm font-light text-amber-950/60 mt-3">
                {total > 0
                  ? `Found ${total} product${total === 1 ? '' : 's'} matching your search.`
                  : 'No products found for your search term.'}
              </p>
            </>
          ) : (
            <h1 className="text-4xl md:text-5xl font-serif leading-tight">
              Search the <span className="italic">Collection</span>
            </h1>
          )}
        </div>

        {/* Results Grid */}
        {query && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : query && products.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-950/5 text-amber-950/30">
              <Search size={32} />
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold">No matches found</h2>
              <p className="text-sm font-light text-amber-950/60 leading-relaxed">
                We couldn&apos;t find any products matching &ldquo;{query}&rdquo;. Try a different keyword or browse our collection.
              </p>
            </div>

            {/* Suggestion pills */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest font-bold text-amber-950/40">
                Try searching for
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="px-4 py-2 border border-amber-900/15 hover:border-[#8B3A2A] rounded-sm text-xs font-medium hover:text-[#8B3A2A] transition-colors"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/products"
              className="inline-block bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] px-8 py-3.5 text-xs uppercase tracking-widest font-bold transition-all rounded-sm shadow-md"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          /* No query state */
          <div className="text-center py-24 space-y-8">
            <div className="space-y-3 max-w-md mx-auto">
              <p className="text-sm font-light text-amber-950/60 leading-relaxed">
                Use the search bar in the navigation to find products. Or explore our collection directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="px-4 py-2 border border-amber-900/15 hover:border-[#8B3A2A] rounded-sm text-xs font-medium hover:text-[#8B3A2A] transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
            <Link
              href="/products"
              className="inline-block bg-[#8B3A2A] hover:bg-[#8B3A2A]/90 text-[#F5EFE6] px-8 py-3.5 text-xs uppercase tracking-widest font-bold transition-all rounded-sm shadow-md"
            >
              Browse All Products
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
