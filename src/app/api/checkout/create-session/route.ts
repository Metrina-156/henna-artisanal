import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any, // fallback to latest stable behavior
});

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 checkout sessions per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`checkout:${ip}`, 10, 60_000);
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

    const body = await request.json();
    const { items, customerInfo, shippingAddress, shippingMethod } = body;

    // 1. Basic validation of structure
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required.' }, { status: 400 });
    }

    if (!customerInfo || !shippingAddress || !shippingMethod) {
      return NextResponse.json({ error: 'Customer information, shipping address, and shipping method are required.' }, { status: 400 });
    }

    // 2. Validate Contact Fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    if (!emailRegex.test(customerInfo.email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customerInfo.phone.replace(/[\s\-]/g, ''))) {
      return NextResponse.json({ error: 'Please provide a valid 10-digit Indian phone number.' }, { status: 400 });
    }

    // 3. Validate Shipping Address Fields
    if (!shippingAddress.line1.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim()) {
      return NextResponse.json({ error: 'Address line 1, city, and state are required.' }, { status: 400 });
    }
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(shippingAddress.pincode)) {
      return NextResponse.json({ error: 'Please provide a valid 6-digit postal code (pincode).' }, { status: 400 });
    }

    // 4. Server-Side Price & Stock Verification (Crucial Security Check)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    for (const item of items as CheckoutItemInput[]) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({ error: 'Invalid product item format.' }, { status: 400 });
      }

      // Fetch the product from MongoDB
      const dbProduct = await Product.findById(item.productId);

      if (!dbProduct || !dbProduct.isActive) {
        return NextResponse.json({ error: `Product not found or inactive.` }, { status: 400 });
      }

      // Check stock availability
      if (dbProduct.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} left in stock.` },
          { status: 400 }
        );
      }

      // Accumulate subtotal using the server-side price (ignore any prices sent from the client)
      subtotal += dbProduct.price * item.quantity;

      // Construct Stripe line item
      const mainImage = dbProduct.images[0]?.url || '';
      
      // Ensure absolute image URL if possible, otherwise skip sending it to Stripe
      const absoluteImages = mainImage 
        ? [new URL(mainImage, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').toString()] 
        : [];

      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: dbProduct.name,
            description: dbProduct.shortDescription,
            images: absoluteImages,
            metadata: {
              productId: dbProduct._id.toString(),
              slug: dbProduct.slug,
            },
          },
          unit_amount: Math.round(dbProduct.price * 100), // convert to paise
        },
        quantity: item.quantity,
      });
    }

    // 5. Calculate shipping costs based on the shippingMethod
    let shippingCost = 99; // Standard shipping default
    if (shippingMethod === 'express') {
      shippingCost = 199;
    } else if (shippingMethod === 'standard' && subtotal >= 999) {
      shippingCost = 0; // Free shipping threshold
    }

    // 6. Create Stripe Checkout Session
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerInfo.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customerInfo: JSON.stringify(customerInfo),
        shippingAddress: JSON.stringify(shippingAddress),
        shippingMethod: shippingMethod,
      },
    };

    // Include shipping rate if cost is greater than 0
    if (shippingCost > 0) {
      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shippingCost * 100), // paise
              currency: 'inr',
            },
            display_name: shippingMethod === 'express' ? 'Express Delivery' : 'Standard Delivery',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: shippingMethod === 'express' ? 2 : 5,
              },
              maximum: {
                unit: 'business_day',
                value: shippingMethod === 'express' ? 3 : 7,
              },
            },
          },
        },
      ];
    } else {
      // Free Shipping
      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'inr',
            },
            display_name: 'Free Standard Delivery (Orders over ₹999)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error('Stripe Session Creation Failure:', error);
    return NextResponse.json(
      { error: 'An error occurred during Stripe session checkout creation.' },
      { status: 500 }
    );
  }
}
