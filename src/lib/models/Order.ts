import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICustomer {
  name: string;
  email: string;
  phone: string;
}

export interface IShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrder {
  orderNumber: string;
  customer: ICustomer;
  shippingAddress: IShippingAddress;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  stripeSessionId: string;
  stripePaymentIntentId: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}

const customerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: false });

const shippingAddressSchema = new Schema<IShippingAddress>({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true }
}, { _id: false });

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true }
}, { _id: false });

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: customerSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: { type: [orderItemSchema], required: true, validate: [itemsLimit, 'Order must contain at least one item'] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    stripeSessionId: { type: String, required: true },
    stripePaymentIntentId: { type: String, required: true },
    trackingNumber: { type: String },
    notes: { type: String }
  },
  {
    timestamps: true,
  }
);

function itemsLimit(val: IOrderItem[]) {
  return val.length > 0;
}

// Pre-validate hook to generate sequential / unique order number: e.g., HNA-2026-0001
orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    try {
      // Access the Order model. Note: compile models conditionally, so we query it via connection models list.
      const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
      
      // Find the last order created in the current year
      const lastOrder = await OrderModel.findOne(
        { orderNumber: new RegExp(`^HNA-${year}-`) },
        {},
        { sort: { createdAt: -1 } }
      );

      let nextSequence = 1;
      if (lastOrder && lastOrder.orderNumber) {
        const parts = lastOrder.orderNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextSequence = lastSeq + 1;
        }
      }

      const paddedSeq = String(nextSequence).padStart(4, '0');
      this.orderNumber = `HNA-${year}-${paddedSeq}`;
    } catch (error) {
      // Fallback in case of database resolution failure or circular initialization issue
      console.warn('Order number generation failed, using randomized fallback:', error);
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      this.orderNumber = `HNA-${year}-${randomPart}`;
    }
  }
  next();
});

const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', orderSchema);

export default Order;
