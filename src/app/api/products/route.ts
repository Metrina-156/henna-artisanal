import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

/**
 * GET /api/products
 * Returns paginated, filtered, and sorted active products.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '12', 10));
    const skip = (page - 1) * limit;

    // Sorting parameters
    const sortOption = searchParams.get('sort') || 'featured';

    // Build query object
    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag; // Mongoose automatically queries arrays for elements matching the value
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    if (featured === 'true' || featured === '1') {
      query.isFeatured = true;
    }

    if (search) {
      const cleanSearch = search.trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
        { tags: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    // Determine sorting criteria
    let sortCriteria: any = {};
    switch (sortOption) {
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

    // Execute database queries in parallel
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        products,
        total,
        page,
        totalPages,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products. Please check server logs.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Creates a new product (admin only, authorization to be added in Phase 3).
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Basic validation
    const requiredFields = ['name', 'description', 'shortDescription', 'price', 'images', 'category', 'weight'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create and save the new product
    const product = new Product(body);
    await product.save();

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.message },
        { status: 400 }
      );
    }
    
    // Handle unique constraint violations (e.g. slug)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A product with a similar name already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product. Please check server logs.' },
      { status: 500 }
    );
  }
}
