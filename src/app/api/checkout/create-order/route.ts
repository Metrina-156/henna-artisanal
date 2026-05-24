import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
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
    const lineItemsForDB = [];
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

      // Construct DB order item
      const mainImage = dbProduct.images[0]?.url || '/images/placeholder.jpg';

      lineItemsForDB.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        image: mainImage,
      });
    }

    // 5. Calculate shipping costs based on the shippingMethod
    let shippingCost = 99; // Standard shipping default
    if (shippingMethod === 'express') {
      shippingCost = 199;
    } else if (shippingMethod === 'standard' && subtotal >= 999) {
      shippingCost = 0; // Free shipping threshold
    }

    const total = subtotal + shippingCost;

    // 6. Create Razorpay Order
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay key credentials missing from environment variables.');
      return NextResponse.json(
        { error: 'Payment gateway configuration error.' },
        { status: 500 }
      );
    }

    const rzpOrderOptions = {
      amount: Math.round(total * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Math.floor(100000 + Math.random() * 900000)}`,
      notes: {
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone.replace(/[\s\-]/g, ''),
      }
    };

    const rzpOrder = await razorpay.orders.create(rzpOrderOptions);

    // 7. Save pending Order Document in MongoDB
    const order = new Order({
      customer: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone.replace(/[\s\-]/g, ''),
      },
      shippingAddress: {
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India',
      },
      items: lineItemsForDB,
      subtotal: subtotal,
      shippingCost: shippingCost,
      total: total,
      status: 'pending',
      paymentStatus: 'pending',
      razorpayOrderId: rzpOrder.id,
      notes: customerInfo.notes || '',
    });

    await order.save();
    console.log(`Pending Order created for Razorpay Order: ${rzpOrder.id}. Order number: ${order.orderNumber}`);

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderNumber: order.orderNumber,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Razorpay Order Creation Failure:', error);
    return NextResponse.json(
      { error: 'An error occurred during Razorpay order checkout creation.' },
      { status: 500 }
    );
  }
}
