import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { verifySessionToken } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
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
 * Triggers a Stripe payment refund and marks order as refunded.
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

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Stripe Payment Intent ID is missing for this order. Refund cannot be initiated.' },
        { status: 400 }
      );
    }

    console.log(`Initiating Stripe refund for PaymentIntent ${order.stripePaymentIntentId} (Order: ${order.orderNumber})...`);

    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });

      console.log('Stripe Refund response status:', refund.status);

      // Update order state
      order.paymentStatus = 'refunded';
      order.status = 'refunded';
      await order.save();

      return NextResponse.json(order, { status: 200 });
    } catch (stripeError: any) {
      console.error('Stripe Refund API error:', stripeError);
      return NextResponse.json(
        { error: stripeError.message || 'Stripe refund processing failed.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing order refund:', error);
    return NextResponse.json({ error: 'Failed to process refund.' }, { status: 500 });
  }
}
