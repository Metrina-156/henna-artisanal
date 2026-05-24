import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import ProductForm from '../../ProductForm';
import { notFound } from 'next/navigation';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await connectDB();
  const { id } = await params;

  let productRaw;
  try {
    productRaw = await Product.findById(id).lean();
  } catch (error) {
    console.error('Invalid ID or database error while fetching product:', error);
    return notFound();
  }

  if (!productRaw) {
    return notFound();
  }

  // Convert Mongo documents into plain JSON objects for Client Component hydration
  const product = JSON.parse(JSON.stringify(productRaw));

  return (
    <div className="space-y-6">
      <ProductForm initialData={product} productId={id} isEdit={true} />
    </div>
  );
}
