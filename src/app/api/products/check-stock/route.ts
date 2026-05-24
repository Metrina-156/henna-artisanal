import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';

interface StockCheckItem {
  productId: string;
  quantity: number;
}

/**
 * POST /api/products/check-stock
 *
 * Accepts an array of { productId, quantity } and returns per-item stock status.
 * Used by the cart page and checkout to validate availability before payment.
 *
 * Response shape:
 * {
 *   results: [{
 *     productId: string,
 *     name: string,
 *     requestedQuantity: number,
 *     currentStock: number,
 *     available: boolean,    // currentStock >= requestedQuantity && currentStock > 0
 *     isActive: boolean,
 *   }],
 *   allAvailable: boolean,  // true only if every item is available
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { items } = body as { items: StockCheckItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required.' },
        { status: 400 }
      );
    }

    // Validate structure
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a valid productId and quantity >= 1.' },
          { status: 400 }
        );
      }
    }

    // Fetch all requested products in a single query
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name stock isActive')
      .lean();

    // Build results indexed by productId for O(1) lookup
    const productMap = new Map(
      products.map((p: any) => [p._id.toString(), p])
    );

    let allAvailable = true;

    const results = items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        allAvailable = false;
        return {
          productId: item.productId,
          name: 'Unknown Product',
          requestedQuantity: item.quantity,
          currentStock: 0,
          available: false,
          isActive: false,
        };
      }

      const available =
        (product as any).isActive &&
        (product as any).stock >= item.quantity;

      if (!available) allAvailable = false;

      return {
        productId: item.productId,
        name: (product as any).name,
        requestedQuantity: item.quantity,
        currentStock: (product as any).stock,
        available,
        isActive: (product as any).isActive,
      };
    });

    return NextResponse.json({ results, allAvailable }, { status: 200 });
  } catch (error: any) {
    console.error('check-stock error:', error);
    return NextResponse.json(
      { error: 'Failed to check stock availability.' },
      { status: 500 }
    );
  }
}
