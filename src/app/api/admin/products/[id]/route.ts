import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { verifySessionToken } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-session')?.value;
  const decoded = token ? await verifySessionToken(token) : null;
  return decoded && decoded.role === 'admin';
}

/**
 * GET /api/admin/products/[id]
 * Retrieves a single product by ID.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin product:', error);
    return NextResponse.json({ error: 'Failed to retrieve product.' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/products/[id]
 * Updates a product by ID.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Apply properties
    const keys = [
      'name',
      'description',
      'shortDescription',
      'price',
      'compareAtPrice',
      'images',
      'category',
      'tags',
      'stock',
      'isActive',
      'isFeatured',
      'weight',
      'ingredients',
      'howToUse',
    ];

    keys.forEach((key) => {
      if (body[key] !== undefined) {
        (product as any)[key] = body[key];
      }
    });

    await product.save();
    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation Error', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Deletes a product by ID.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const result = await Product.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
