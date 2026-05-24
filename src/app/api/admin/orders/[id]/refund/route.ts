import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { verifySessionToken } from '@/lib/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-session')?.value;
  const decoded = token ? await verifySessionToken(token) : null;
  return decoded && decoded.role === 'admin';
}

/**
 * POST /api/admin/orders/[id]/refund
 * Triggers a Razorpay payment refund and marks order as refunded.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: `Cannot refund order with payment status: ${order.paymentStatus}. Only paid orders can be refunded.` },
        { status: 400 }
      );
    }

    if (!order.razorpayPaymentId && !order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Payment transaction identifier is missing for this order. Refund cannot be initiated.' },
        { status: 400 }
      );
    }

    try {
      if (order.razorpayPaymentId) {
        console.log(`Initiating Razorpay refund for Payment ID ${order.razorpayPaymentId} (Order: ${order.orderNumber})...`);
        
        const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
          notes: {
            orderNumber: order.orderNumber,
            reason: 'Admin initiated refund via dashboard',
          }
        });

        console.log('Razorpay Refund response status:', refund.status);
      } else {
        console.warn(`Stripe payment refund requested but Stripe SDK is uninstalled. Transaction ID: ${order.stripePaymentIntentId}`);
        return NextResponse.json(
          { error: 'Stripe refund cannot be processed as the application has migrated to Razorpay. Please refund manually in the Stripe Dashboard.' },
          { status: 400 }
        );
      }

      // Update order state
      order.paymentStatus = 'refunded';
      order.status = 'refunded';
      await order.save();

      return NextResponse.json(order, { status: 200 });
    } catch (rzpError: any) {
      console.error('Razorpay Refund API error:', rzpError);
      return NextResponse.json(
        { error: rzpError.message || 'Razorpay refund processing failed.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing order refund:', error);
    return NextResponse.json({ error: 'Failed to process refund.' }, { status: 500 });
  }
}
