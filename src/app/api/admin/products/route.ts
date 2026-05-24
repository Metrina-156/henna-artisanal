import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { verifySessionToken } from '@/lib/auth';

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-session')?.value;
  const decoded = token ? await verifySessionToken(token) : null;
  return decoded && decoded.role === 'admin';
}

/**
 * GET /api/admin/products
 * Returns all products (including inactive ones) for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Failed to retrieve products.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/products
 * Creates a new product.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    // Required fields check
    const requiredFields = ['name', 'description', 'shortDescription', 'price', 'images', 'category', 'weight', 'stock'];
    const missingFields = requiredFields.filter((field) => body[field] === undefined || body[field] === null);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Ensure images has at least one item
    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
    }

    const product = new Product({
      name: body.name,
      description: body.description,
      shortDescription: body.shortDescription,
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
      images: body.images,
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [],
      stock: Number(body.stock),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
      weight: Number(body.weight),
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      howToUse: body.howToUse || '',
    });

    await product.save();
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation Error', details: error.message }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A product with a similar name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}
