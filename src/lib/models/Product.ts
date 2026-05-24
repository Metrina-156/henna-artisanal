import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId: string;
  alt: string;
}

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  images: IProductImage[];
  category: 'henna-cones' | 'powders' | 'kits' | 'accessories' | 'masks';
  tags: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  weight: number;
  ingredients: string[];
  howToUse: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}

const productImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String, required: true }
}, { _id: false });

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 160 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    images: { type: [productImageSchema], required: true, validate: [arrayLimit, 'Product must have at least one image'] },
    category: {
      type: String,
      required: true,
      enum: ['henna-cones', 'powders', 'kits', 'accessories', 'masks'],
    },
    tags: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    weight: { type: Number, required: true, min: 0 }, // weight in grams
    ingredients: { type: [String], default: [] },
    howToUse: { type: String, default: '' }
  },
  {
    timestamps: true,
  }
);

function arrayLimit(val: IProductImage[]) {
  return val.length > 0;
}

// Slugify helper
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')          // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

// Pre-validate middleware to auto-generate slug from name
productSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name);
  }
  next();
});

const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', productSchema);

export default Product;
