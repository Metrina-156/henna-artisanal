import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://artisanal-henna.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes that are always included
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Attempt to fetch active product slugs from the database.
  // If this fails (e.g. Atlas IP whitelist blocks build servers), we fall back
  // gracefully to static routes only so the build never crashes.
  try {
    await connectDB();
    const products = await Product.find({ isActive: true })
      .select('slug updatedAt')
      .lean();

    const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.warn(
      '[sitemap] Database connection failed — returning static routes only. ' +
        'Check your MONGODB_URI and Atlas IP whitelist for build servers.',
      error
    );
    return staticRoutes;
  }
}
