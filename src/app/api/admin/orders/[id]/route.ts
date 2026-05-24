import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
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
 * GET /api/admin/orders/[id]
 * Retrieves full details of a specific order.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    
    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin order details:', error);
    return NextResponse.json({ error: 'Failed to retrieve order details.' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/orders/[id]
 * Updates status, trackingNumber, or notes of a specific order.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Apply fields
    if (body.status) {
      const allowedStatus = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!allowedStatus.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
      }
      order.status = body.status;
    }

    if (body.trackingNumber !== undefined) {
      order.trackingNumber = body.trackingNumber.trim();
    }

    if (body.notes !== undefined) {
      order.notes = body.notes.trim();
    }

    await order.save();
    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error('Error updating order:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation Error', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
