import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { verifySessionToken, verifyGuestOrderToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-session')?.value;
  const decoded = token ? await verifySessionToken(token) : null;
  return decoded && decoded.role === 'admin';
}

/**
 * GET /api/orders/by-razorpay-order/[orderId]
 * Retrieves an order matching the specified Razorpay Order ID.
 * Secured with guest token authentication or admin session verification.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  // Rate limit: 10 order queries per minute per IP to prevent brute-forcing
  const ip = getClientIp(request);
  const rl = rateLimit(`order-query:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      }
    );
  }

  try {
    await connectDB();
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID parameter is required.' }, { status: 400 });
    }

    // Authenticate: Request must be from an admin session OR contain a valid guest token matching the order ID
    const token = request.nextUrl.searchParams.get('token');
    const isAdmin = await checkAdmin(request);
    const isGuestAuthorized = token ? await verifyGuestOrderToken(orderId, token) : false;

    if (!isAdmin && !isGuestAuthorized) {
      console.warn(`[UNAUTHORIZED ORDER ACCESS DETECTED] Order ID: ${orderId} | IP: ${ip}`);
      return NextResponse.json(
        { error: 'Unauthorized. A valid access token or active session is required.' },
        { status: 403 }
      );
    }

    // Query Order document matching the Razorpay Order ID
    const order = await Order.findOne({ razorpayOrderId: orderId }).lean();

    if (!order) {
      return NextResponse.json(
        { error: `Order with Razorpay Order ID "${orderId}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching order by Razorpay order ID:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order. Please check server logs.' },
      { status: 500 }
    );
  }
}

