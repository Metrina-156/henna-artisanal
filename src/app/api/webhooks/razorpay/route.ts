import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Webhook signature check skipped: missing x-razorpay-signature header.');
      return NextResponse.json({ error: 'Missing webhook signature header.' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook gateway configuration error.' }, { status: 500 });
    }

    // 1. Verify Razorpay Webhook signature (timing-safe)
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (!timingSafeEqual(expectedSignature, signature)) {
      console.warn('Webhook signature verification failed.');
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log(`[RAZORPAY WEBHOOK] Received event: ${event.event}`);

    // We process order.paid as our primary payment success event
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      await connectDB();

      const payload = event.payload;
      const orderEntity = payload.order?.entity;
      const paymentEntity = payload.payment?.entity;

      const rzpOrderId = orderEntity?.id || paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (!rzpOrderId) {
        console.error('Could not find Razorpay order ID in webhook payload:', event);
        return NextResponse.json({ error: 'Missing Razorpay order ID in payload.' }, { status: 400 });
      }

      // 2. Perform atomic update: check and set paid status atomically to prevent double decrement race
      const updatedOrder = await Order.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId, paymentStatus: { $ne: 'paid' } },
        {
          $set: {
            paymentStatus: 'paid',
            status: 'confirmed',
            ...(rzpPaymentId ? { razorpayPaymentId: rzpPaymentId } : {}),
          }
        },
        { new: true }
      );

      if (!updatedOrder) {
        // Find existing order to verify if it was already marked as paid (client verification request completed first)
        const existingOrder = await Order.findOne({ razorpayOrderId: rzpOrderId });
        if (!existingOrder) {
          console.warn(`[RAZORPAY WEBHOOK] Order not found for Razorpay Order ID: ${rzpOrderId}`);
          return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
        }

        if (existingOrder.paymentStatus === 'paid') {
          console.log(`[RAZORPAY WEBHOOK] Order ${existingOrder.orderNumber} already marked as paid. Skipping update.`);
          return NextResponse.json({ received: true, alreadyProcessed: true }, { status: 200 });
        }

        console.error(`[RAZORPAY WEBHOOK] Atomic transition failed for Razorpay Order ID: ${rzpOrderId}`);
        return NextResponse.json({ error: 'Order update conflict.' }, { status: 409 });
      }

      console.log(`[RAZORPAY WEBHOOK] Order ${updatedOrder.orderNumber} successfully marked as PAID via webhook.`);

      // 3. Decrement inventory stock levels atomically (only once since the state transition succeeded)
      for (const item of updatedOrder.items) {
        if (item.productId) {
          const updatedProduct = await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } },
            { new: true }
          );

          if (updatedProduct) {
            console.log(`Stock updated atomically via Webhook for ${updatedProduct.name}. New stock: ${updatedProduct.stock}`);
            if (updatedProduct.stock < 0) {
              console.warn(`Stock warning via Webhook: product ${updatedProduct.name} (${updatedProduct._id}) stock is negative: ${updatedProduct.stock}`);
            }
          }
        }
      }

      // 4. Mock confirmation email dispatch
      console.log(`[WEBHOOK CONFIRMATION EMAIL QUEUED] To: ${updatedOrder.customer.email} | Order: ${updatedOrder.orderNumber}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

