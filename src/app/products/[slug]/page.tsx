import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import ProductAddToCart from '@/components/ProductAddToCart';
import ProductAccordion from '@/components/ProductAccordion';
import Link from 'next/link';

// Enable fallback dynamic rendering for pages not pre-compiled at build time
export const dynamicParams = true;

// ISR: Re-generate each product page at most once per 10 minutes
export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for SEO.
 * Reuses the connectDB cached connection singleton.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    await connectDB();
    const product = await Product.findOne({ slug, isActive: true }).select('name description shortDescription images').lean();
    
    if (!product) {
      return {
        title: 'Product Not Found | Artisanal Henna',
        description: 'The requested artisanal henna product could not be located.',
      };
    }

    const mainImage = product.images[0]?.url || '/images/og-placeholder.jpg';

    const description = product.shortDescription || (product.description as string).substring(0, 160);

    return {
      title: product.name,
      description,
      alternates: { canonical: `/products/${slug}` },
      openGraph: {
        title: `${product.name} | Artisanal Henna`,
        description,
        url: `/products/${slug}`,
        images: [
          {
            url: mainImage,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | Artisanal Henna`,
        description,
        images: [mainImage],
      },
    };
  } catch (error) {
    console.error('Metadata generation failed:', error);
    return {
      title: 'Artisanal Henna Product Details',
    };
  }
}

/**
 * Generate static paths for SSG.
 * Gracefully returns an empty array on connection error so build is not blocked.
 */
export async function generateStaticParams() {
  try {
    await connectDB();
    // Fetch only active product slugs
    const products = await Product.find({ isActive: true }).select('slug').lean();
    return products.map((product: any) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.error('Static params generation failed at build time. Defaulting to request-time fallback.', error);
    return [];
  }
}

/**
 * Server component rendering the product detail layout.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  await connectDB();
  const { slug } = await params;

  // Retrieve the main product
  const productRaw = await Product.findOne({ slug, isActive: true }).lean();

  if (!productRaw) {
    notFound();
  }

  // Retrieve up to 4 related products from the same category
  const relatedRaw = await Product.find({
    category: productRaw.category,
    isActive: true,
    _id: { $ne: productRaw._id },
  })
    .limit(4)
    .lean();

  // Map to plain serializable JS objects
  const product = {
    ...productRaw,
    _id: productRaw._id.toString(),
    createdAt: productRaw.createdAt.toISOString(),
    updatedAt: productRaw.updatedAt.toISOString(),
  } as any;

  const relatedProducts = relatedRaw.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'henna-cones': return 'Fresh Henna Cones';
      case 'powders': return 'Organic Powders';
      case 'kits': return 'Artisanal Kits';
      case 'masks': return 'Botanical Hair Masks';
      case 'accessories': return 'Tools & Accessories';
      default: return cat;
    }
  };

  return (
    <main className="min-h-screen bg-[#F5EFE6] pt-32 md:pt-40 pb-24 text-amber-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs uppercase tracking-widest text-amber-950/60 mb-10 flex flex-wrap gap-2 items-center">
          <Link href="/" className="hover:text-[#8B3A2A] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#8B3A2A] transition-colors">Shop</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category}`} className="hover:text-[#8B3A2A] transition-colors">
            {getCategoryLabel(product.category)}
          </Link>
          <span>/</span>
          <span className="text-amber-950 font-bold">{product.name}</span>
        </nav>

        {/* Detailed Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">
          
          {/* Left Column: Image Gallery Component */}
          <div className="lg:col-span-6">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right Column: Meta Info, Actions, Specifications Accordion */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              {/* Category tag */}
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] font-extrabold text-[#8B3A2A] bg-[#8B3A2A]/5 px-3 py-1 rounded">
                {getCategoryLabel(product.category)}
              </span>

              {/* Product Title */}
              <h1 className="text-4xl md:text-5xl font-serif leading-tight font-semibold">
                {product.name}
              </h1>

              {/* Price Details */}
              <div className="flex items-baseline gap-4 pt-1">
                <span className="text-3xl font-bold text-[#8B3A2A]">
                  ₹{product.price}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-lg text-amber-950/40 line-through">
                    ₹{product.compareAtPrice}
                  </span>
                )}
              </div>

              {/* Short Description */}
              <p className="text-sm font-light text-amber-950/70 leading-relaxed pt-2">
                {product.shortDescription}
              </p>
            </div>

            {/* Tags Pills */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="text-[10px] tracking-wider uppercase font-bold text-amber-900/60 bg-[#F5EFE6]/60 border border-amber-900/10 px-3 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <hr className="border-amber-950/10" />

            {/* Add to Cart Actions (Stepper, Stock Status, Cart Store Trigger) */}
            <ProductAddToCart product={product} />

            <hr className="border-amber-950/10" />

            {/* Accordion Specs */}
            <ProductAccordion
              description={product.description}
              ingredients={product.ingredients}
              howToUse={product.howToUse}
              weight={product.weight}
            />

          </div>
        </div>

        {/* Related Products Carousel/Row */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-amber-950/10 pt-20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-[#8B3A2A] mb-3 block">Complete The Ritual</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold">You May Also <span className="italic">Like</span></h2>
              </div>
              <Link href={`/products?category=${product.category}`} className="text-xs uppercase tracking-widest font-bold border-b border-amber-950 hover:text-[#8B3A2A] hover:border-[#8B3A2A] pb-1.5 transition-all">
                View Category
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relProd) => (
                <ProductCard key={relProd._id} product={relProd} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
