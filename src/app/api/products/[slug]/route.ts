import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/products/[slug]
 * Retrieves a single product by its unique slug.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await connectDB();
    const { slug } = await params;

    const product = await Product.findOne({ slug, isActive: true }).lean();

    if (!product) {
      return NextResponse.json(
        { error: `Product with slug "${slug}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve product. Please check server logs.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[slug]
 * Updates an existing product (admin only, authorization to be added in Phase 3).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await connectDB();
    const { slug } = await params;

    const body = await request.json();

    // Find the product by slug
    const product = await Product.findOne({ slug });

    if (!product) {
      return NextResponse.json(
        { error: `Product with slug "${slug}" not found.` },
        { status: 404 }
      );
    }

    // Apply fields from request body to the document
    Object.keys(body).forEach((key) => {
      // Do not allow manually setting timestamps or overriding _id
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        (product as any)[key] = body[key];
      }
    });

    // Save the document (this triggers pre-validate and pre-save hooks, e.g. regenerating the slug if the name changed)
    await product.save();

    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error('Error updating product:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.message },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A product conflict occurred. This name or slug might already exist.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update product. Please check server logs.' },
      { status: 500 }
    );
  }
}
