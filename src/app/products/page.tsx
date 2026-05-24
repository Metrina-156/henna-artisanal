import { Metadata } from 'next';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import ProductSort from '@/components/ProductSort';
import Link from 'next/link';

// ISR: Re-generate this page at most once per hour
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: 'Shop Artisanal Henna Products',
    description:
      'Browse our full collection of organic henna cones, powders, bridal kits, hair masks, and accessories. Filter by category and price.',
    alternates: { canonical: '/products' },
    openGraph: {
      title: 'Shop Artisanal Henna Products',
      description:
        'Browse our full collection of organic henna cones, powders, bridal kits, and accessories.',
      url: '/products',
    },
  };
}


interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    search?: string;
    page?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await connectDB();

  // Resolve search parameters (awaited as required in Next.js 15/16 App Router)
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category || '';
  const currentTag = resolvedParams.tag || '';
  const currentSearch = resolvedParams.search || '';
  const currentSort = resolvedParams.sort || 'featured';
  const minPrice = resolvedParams.minPrice || '';
  const maxPrice = resolvedParams.maxPrice || '';
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  
  const limit = 9; // Show 9 products per page for a clean 3-column layout grid
  const skip = (page - 1) * limit;

  // Build the Mongoose search query
  const query: any = { isActive: true };

  if (currentCategory) {
    query.category = currentCategory;
  }

  if (currentTag) {
    query.tags = currentTag;
  }

  if (currentSearch) {
    query.$or = [
      { name: { $regex: currentSearch.trim(), $options: 'i' } },
      { description: { $regex: currentSearch.trim(), $options: 'i' } },
      { shortDescription: { $regex: currentSearch.trim(), $options: 'i' } }
    ];
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Determine sorting configuration
  let sortCriteria: any = {};
  switch (currentSort) {
    case 'newest':
      sortCriteria = { createdAt: -1 };
      break;
    case 'price-asc':
      sortCriteria = { price: 1 };
      break;
    case 'price-desc':
      sortCriteria = { price: -1 };
      break;
    case 'featured':
    default:
      sortCriteria = { isFeatured: -1, createdAt: -1 };
      break;
  }

  // Perform parallel database queries for efficiency
  const [productsRaw, totalProducts, allTags, categoryAggregation] = await Promise.all([
    Product.find(query).sort(sortCriteria).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
    Product.distinct('tags', { isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Map Mongo Documents to a serializable plain JS object to satisfy Next.js Server Component specifications
  const products = productsRaw.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const categories = categoryAggregation.map((c) => ({
    category: c._id,
    count: c.count
  }));

  const totalPages = Math.ceil(totalProducts / limit);

  // Pagination navigation links builder
  const createPageLink = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    if (currentTag) params.set('tag', currentTag);
    if (currentSearch) params.set('search', currentSearch);
    if (currentSort) params.set('sort', currentSort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('page', pageNumber.toString());
    return `/products?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#F5EFE6] pt-32 md:pt-40 pb-24 text-amber-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Editorial Heading */}
        <div className="border-b border-amber-950/10 pb-8 mb-12">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-[#8B3A2A] mb-3 block">Boutique</span>
          <h1 className="text-4xl md:text-6xl font-serif leading-tight">
            The <span className="italic">Artisanal</span> Collection
          </h1>
          <p className="text-sm font-light max-w-xl text-amber-950/60 leading-relaxed mt-4">
            Explore our range of premium, organic henna products, kits, and accessories handcrafted using traditional methods to elevate your body art ritual.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ProductFilters categories={categories} allTags={allTags} />
          </div>

          {/* Product Listing Area */}
          <div className="lg:col-span-3 space-y-12">
            
            {/* Top Toolbar */}
            <div className="flex justify-between items-center bg-[#F5EFE6]/50 px-4 py-3 rounded border border-amber-900/5">
              <p className="text-xs tracking-wider text-amber-950/60 font-semibold uppercase">
                {totalProducts > 0 
                  ? `Showing ${skip + 1}–${Math.min(skip + products.length, totalProducts)} of ${totalProducts} Products`
                  : '0 Products Found'
                }
              </p>
              
              {/* Desktop Sort Dropdown */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs tracking-wider uppercase text-amber-950/60 font-bold">Sort:</span>
                <ProductSort currentSort={currentSort} />
              </div>
            </div>

            {/* Product Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-20 bg-[#F5EFE6]/30 border border-dashed border-amber-950/20 rounded-lg p-12 space-y-6">
                <p className="font-serif text-2xl text-amber-950/80">No products matched your filters</p>
                <p className="text-sm font-light text-amber-950/60 max-w-md mx-auto leading-relaxed">
                  Try adjusting your keywords, price limits, or categories to discover our available products.
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-[#8B3A2A] text-[#F5EFE6] px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#8B3A2A]/90 transition-colors shadow-md rounded-sm"
                >
                  Clear Filters
                </Link>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="flex justify-center items-center gap-2 pt-6 border-t border-amber-950/10">
                {/* Previous Page */}
                {page > 1 ? (
                  <Link
                    href={createPageLink(page - 1)}
                    className="px-4 py-2 border border-amber-950/10 hover:border-[#8B3A2A] text-xs font-bold uppercase tracking-wider hover:text-[#8B3A2A] transition-colors rounded-sm"
                  >
                    Prev
                  </Link>
                ) : (
                  <span className="px-4 py-2 border border-amber-950/5 text-amber-950/20 text-xs font-bold uppercase tracking-wider rounded-sm cursor-not-allowed">
                    Prev
                  </span>
                )}

                {/* Numbered Pages */}
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = pageNum === page;
                  return (
                    <Link
                      key={pageNum}
                      href={createPageLink(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-sm border transition-colors ${
                        isCurrent
                          ? 'bg-[#8B3A2A] text-[#F5EFE6] border-[#8B3A2A]'
                          : 'border-amber-950/10 hover:border-[#8B3A2A] text-amber-950/80 hover:text-[#8B3A2A]'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

                {/* Next Page */}
                {page < totalPages ? (
                  <Link
                    href={createPageLink(page + 1)}
                    className="px-4 py-2 border border-amber-950/10 hover:border-[#8B3A2A] text-xs font-bold uppercase tracking-wider hover:text-[#8B3A2A] transition-colors rounded-sm"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-4 py-2 border border-amber-950/5 text-amber-950/20 text-xs font-bold uppercase tracking-wider rounded-sm cursor-not-allowed">
                    Next
                  </span>
                )}
              </nav>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
