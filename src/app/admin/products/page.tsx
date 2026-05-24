'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Loader2, AlertCircle, Check, X, Filter } from 'lucide-react';

interface ProductImage {
  url: string;
  publicId: string;
  alt: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  category: 'henna-cones' | 'powders' | 'kits' | 'accessories' | 'masks';
  tags: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  weight: number;
  ingredients: string[];
  howToUse: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Deletion Modal State
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status changing state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products');
      if (!res.ok) {
        throw new Error('Failed to fetch products.');
      }
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update product status.');
      }

      const updatedProduct = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: updatedProduct.isActive } : p))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update product status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteProductId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete product.');
      }

      setProducts((prev) => prev.filter((p) => p._id !== deleteProductId));
      setDeleteProductId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'henna-cones', label: 'Henna Cones' },
    { value: 'powders', label: 'Powders' },
    { value: 'kits', label: 'Kits' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'masks', label: 'Masks' },
  ];

  const formatCategory = (cat: string) => {
    return cat
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Products Catalog</h1>
          <p className="text-xs text-stone-400 mt-1">Manage items, stock quantities, and details.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center justify-center gap-2 bg-[#8B3A2A] text-white hover:bg-[#722F22] px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-stone-200 rounded-lg flex flex-col sm:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search products by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] focus:bg-white transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] focus:bg-white transition-colors appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-[#8B3A2A] animate-spin" />
            <p className="text-sm text-stone-400 font-light">Loading products catalog...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-4">
            <div className="inline-flex p-3 bg-red-50 text-red-700 rounded-full">
              <AlertCircle size={24} />
            </div>
            <p className="text-sm text-stone-600 font-medium">{error}</p>
            <button
              onClick={fetchProducts}
              className="text-xs font-bold text-[#8B3A2A] uppercase hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-stone-400 font-light">No products found matching your criteria.</p>
            {products.length === 0 && (
              <Link
                href="/admin/products/new"
                className="mt-4 inline-block text-xs font-bold text-[#8B3A2A] uppercase hover:underline"
              >
                Create your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 text-[10px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-6 w-16">Image</th>
                  <th className="py-3 px-6">Product details</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6 text-right">Price</th>
                  <th className="py-3 px-6 text-center">Stock</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((product) => {
                  const hasLowStock = product.stock < 5;
                  return (
                    <tr key={product._id} className="hover:bg-stone-50/50 transition-colors">
                      {/* Image column */}
                      <td className="py-4 px-6">
                        <div className="h-12 w-12 rounded border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt || product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-stone-400 font-bold uppercase">No image</span>
                          )}
                        </div>
                      </td>

                      {/* Name & Slug column */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-stone-900 text-sm">{product.name}</div>
                        <div className="text-[10px] font-mono text-stone-400 mt-0.5">{product.slug}</div>
                      </td>

                      {/* Category column */}
                      <td className="py-4 px-6 text-stone-500 font-light">
                        {formatCategory(product.category)}
                      </td>

                      {/* Price column */}
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold font-mono">₹{product.price.toLocaleString('en-IN')}</div>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <div className="text-[10px] font-mono text-stone-400 line-through">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Stock column */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-mono text-sm font-bold ${hasLowStock ? 'text-amber-600' : 'text-stone-900'}`}>
                            {product.stock}
                          </span>
                          {hasLowStock && product.isActive && (
                            <span className="inline-block px-1.5 py-0.5 text-[8px] uppercase font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status column */}
                      <td className="py-4 px-6 text-center">
                        <button
                          disabled={togglingId === product._id}
                          onClick={() => handleToggleActive(product._id, product.isActive)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border cursor-pointer transition-all disabled:opacity-50 ${
                            product.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-50 text-stone-400 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {togglingId === product._id ? (
                            <Loader2 size={10} className="animate-spin text-stone-400" />
                          ) : product.isActive ? (
                            <Check size={10} />
                          ) : (
                            <X size={10} />
                          )}
                          <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions column */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => setDeleteProductId(product._id)}
                            className="text-stone-400 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteProductId && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-serif text-lg font-bold text-stone-950">Delete Product?</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Are you sure you want to delete this product? This action is permanent and cannot be undone. Any active carts containing this item will fail validation.
              </p>
            </div>
            <div className="bg-stone-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                disabled={deleting}
                onClick={() => setDeleteProductId(null)}
                className="px-4 py-2 bg-white border border-stone-200 rounded text-xs font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-red-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deleting && <Loader2 size={12} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
