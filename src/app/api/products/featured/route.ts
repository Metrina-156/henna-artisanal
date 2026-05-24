import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

/**
 * GET /api/products/featured
 * Returns up to 4 featured products that are active.
 */
export async function GET() {
  try {
    await connectDB();

    const featuredProducts = await Product.find({ isActive: true, isFeatured: true })
      .limit(4)
      .lean();

    return NextResponse.json(featuredProducts, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve featured products. Please check server logs.' },
      { status: 500 }
    );
  }
}
