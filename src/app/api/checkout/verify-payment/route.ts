import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { signGuestOrderToken } from '@/lib/auth';

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
    await connectDB();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required payment verification parameters.' }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay secret key is missing from environment variables.');
      return NextResponse.json({ error: 'Gateway verification configuration error.' }, { status: 500 });
    }

    // 1. Verify Razorpay signature authenticity (timing-safe)
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isVerified = timingSafeEqual(expectedSignature, razorpay_signature);

    if (!isVerified) {
      console.warn(`[PAYMENT VERIFICATION FAILED] For order_id: ${razorpay_order_id}`);
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
    }

    // 2. Perform atomic state transition to prevent race conditions and double stock decrement
    const updatedOrder = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, paymentStatus: { $ne: 'paid' } },
      {
        $set: {
          paymentStatus: 'paid',
          status: 'confirmed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      // Find the order to see if it was already marked as paid
      const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (!existingOrder) {
        console.error(`[PAYMENT VERIFICATION] Order not found for Rzp Order ID: ${razorpay_order_id}`);
        return NextResponse.json({ error: 'Order not found in database.' }, { status: 404 });
      }

      if (existingOrder.paymentStatus === 'paid') {
        console.log(`[PAYMENT VERIFICATION] Order already updated. Idempotency return for: ${existingOrder.orderNumber}`);
        const guestToken = await signGuestOrderToken(razorpay_order_id);
        return NextResponse.json({ success: true, orderNumber: existingOrder.orderNumber, guestToken }, { status: 200 });
      }

      console.error(`[PAYMENT VERIFICATION] Atomic transition failed for Rzp Order ID: ${razorpay_order_id}`);
      return NextResponse.json({ error: 'Order update conflict.' }, { status: 409 });
    }

    console.log(`[PAYMENT VERIFICATION] Order ${updatedOrder.orderNumber} successfully marked as PAID.`);

    // 3. Atomic stock decrement for each product in the order (only happens once because the state transition succeeded)
    for (const item of updatedOrder.items) {
      if (item.productId) {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        
        if (updatedProduct) {
          console.log(`Stock updated atomically for ${updatedProduct.name}. New stock: ${updatedProduct.stock}`);
          if (updatedProduct.stock < 0) {
            console.warn(`Stock warning: product ${updatedProduct.name} (${updatedProduct._id}) stock is negative: ${updatedProduct.stock}`);
          }
        }
      }
    }

    // 4. Mock confirmation email dispatch
    console.log(`[CONFIRMATION EMAIL QUEUED] To: ${updatedOrder.customer.email} | Order: ${updatedOrder.orderNumber} | Total: ₹${updatedOrder.total}`);

    // 5. Generate secure guest token for receipt access
    const guestToken = await signGuestOrderToken(razorpay_order_id);

    return NextResponse.json({ success: true, orderNumber: updatedOrder.orderNumber, guestToken }, { status: 200 });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment signature:', error);
    return NextResponse.json({ error: 'An error occurred during payment verification.' }, { status: 500 });
  }
}

