import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

/**
 * GET /api/products/categories
 * Returns active product counts grouped by category.
 */
export async function GET() {
  try {
    await connectDB();

    // Use MongoDB aggregation to group active products by category and count them
    const aggregation = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Format the response into a clean list of category and count objects
    const categoriesWithCounts = aggregation.map(item => ({
      category: item._id,
      count: item.count
    }));

    return NextResponse.json(categoriesWithCounts, { status: 200 });
  } catch (error: any) {
    console.error('Error grouping products by category:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve categories. Please check server logs.' },
      { status: 500 }
    );
  }
}
