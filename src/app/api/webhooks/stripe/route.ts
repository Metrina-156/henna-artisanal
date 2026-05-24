import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !endpointSecret) {
    console.error('Webhook signature check skipped: missing stripe-signature header or STRIPE_WEBHOOK_SECRET environment variable.');
    return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  console.log(`Received Stripe Webhook Event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await connectDB();

      // 1. Idempotency Check: Prevent duplicate order processing for the same stripeSessionId
      const existingOrder = await Order.findOne({ stripeSessionId: session.id });
      if (existingOrder) {
        console.log(`Duplicate webhook execution prevented. Order already exists for Stripe Session ID: ${session.id}`);
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // 2. Retrieve session line items, expanding product detail metadata
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
        limit: 100
      });

      // Parse metadata passed from checkout creation
      const metadata = session.metadata || {};
      const customerInfo = JSON.parse(metadata.customerInfo || '{}');
      const shippingAddress = JSON.parse(metadata.shippingAddress || '{}');
      const shippingMethod = metadata.shippingMethod || 'standard';

      // 3. Construct Order Items List
      const items = lineItems.data.map((item) => {
        const product = item.price?.product as Stripe.Product;
        return {
          productId: product?.metadata?.productId || '',
          name: item.description || 'Product',
          price: (item.price?.unit_amount || 0) / 100, // paise to INR
          quantity: item.quantity || 0,
          image: product?.images?.[0] || '/images/placeholder.jpg',
        };
      });

      // 4. Calculate prices
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // Extract shipping cost paid in Stripe Session
      const totalAmountPaid = (session.amount_total || 0) / 100; // cents/paise to units
      const shippingCost = Math.max(0, totalAmountPaid - subtotal);

      // 5. Create Order Document in MongoDB
      const order = new Order({
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
        },
        shippingAddress: {
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          country: shippingAddress.country || 'India',
        },
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal: subtotal,
        shippingCost: shippingCost,
        total: totalAmountPaid,
        status: 'confirmed',
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string || '',
        notes: customerInfo.notes || '',
      });

      await order.save();
      console.log(`Order successfully created for session: ${session.id}. Order number: ${order.orderNumber}`);

      // 6. Atomic stock decrement for each product in the order
      for (const item of items) {
        if (item.productId) {
          const updatedProduct = await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } },
            { new: true } // return updated product
          );
          
          if (updatedProduct) {
            console.log(`Stock updated atomically for ${updatedProduct.name}. New stock: ${updatedProduct.stock}`);
            
            // Check if stock fell below 0 (overselling edge case)
            if (updatedProduct.stock < 0) {
              console.warn(`Stock warning: product ${updatedProduct.name} (${updatedProduct._id}) stock is negative: ${updatedProduct.stock}`);
            }
          }
        }
      }

      // 7. Mock confirmation email dispatch (Phase 6 full implementation)
      console.log(`[CONFIRMATION EMAIL QUEUED] To: ${customerInfo.email} | Order: ${order.orderNumber} | Total: ₹${order.total}`);

    } catch (dbError) {
      console.error(`Failed to process Stripe Webhook event: ${event.id}`, dbError);
      // Return 500 so Stripe retries the webhook later
      return NextResponse.json({ error: 'Database processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
