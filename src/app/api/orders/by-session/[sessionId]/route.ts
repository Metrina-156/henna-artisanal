import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

/**
 * GET /api/orders/by-session/[sessionId]
 * Retrieves an order matching the specified Stripe checkout Session ID.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await connectDB();
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID parameter is required.' }, { status: 400 });
    }

    // Query Order document matching the Stripe session ID
    const order = await Order.findOne({ stripeSessionId: sessionId }).lean();

    if (!order) {
      return NextResponse.json(
        { error: `Order with Stripe Session ID "${sessionId}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching order by Stripe session ID:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order. Please check server logs.' },
      { status: 500 }
    );
  }
}
