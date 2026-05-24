'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, ArrowLeft, GripVertical, HelpCircle } from 'lucide-react';

interface ProductImage {
  url: string;
  publicId: string;
  alt: string;
}

interface ProductFormProps {
  initialData?: any;
  productId?: string;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, productId, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Field States
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [price, setPrice] = useState(initialData?.price || '');
  const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compareAtPrice || '');
  const [category, setCategory] = useState(initialData?.category || 'henna-cones');
  const [stock, setStock] = useState(initialData?.stock || '0');
  const [weight, setWeight] = useState(initialData?.weight || '0');
  const [howToUse, setHowToUse] = useState(initialData?.howToUse || '');

  // Tags and Ingredients stored as strings, split on save
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [ingredientsInput, setIngredientsInput] = useState(initialData?.ingredients?.join(', ') || '');

  // Flags
  const [isActive, setIsActive] = useState(initialData?.isActive !== undefined ? initialData.isActive : true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured !== undefined ? initialData.isFeatured : false);

  // Image Upload States
  const [images, setImages] = useState<ProductImage[]>(initialData?.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // General Status States
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag and Drop Reordering State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // File dropzone hover state
  const [isDragActive, setIsDragActive] = useState(false);

  // Handle Drag & Drop reordering logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDropItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...images];
    const draggedItem = reordered.splice(draggedIndex, 1)[0];
    reordered.splice(index, 0, draggedItem);

    setImages(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Uploader Dropzone handlers
  const handleUploaderDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleUploaderDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFiles(e.target.files);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    setUploading(true);
    setUploadError(null);

    const uploadedImages: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate client side size limit (5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setUploadError(`File "${file.name}" is too large. Max size is 5MB.`);
        setUploading(false);
        return;
      }

      // Prepare formdata
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to upload file "${file.name}".`);
        }

        const data = await res.json();
        uploadedImages.push({
          url: data.url,
          publicId: data.publicId,
          alt: file.name.split('.')[0] || 'Product image', // default alt
        });
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'Image upload failed. Check file format.');
        setUploading(false);
        return;
      }
    }

    setImages((prev) => [...prev, ...uploadedImages]);
    setUploading(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAltTextChange = (index: number, newAlt: string) => {
    setImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, alt: newAlt } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Front-end validations
    if (!name.trim()) return setError('Product name is required.');
    if (!shortDescription.trim()) return setError('Short description is required.');
    if (!description.trim()) return setError('Detailed description is required.');
    if (!price || Number(price) <= 0) return setError('Product price must be greater than 0.');
    if (!weight || Number(weight) <= 0) return setError('Weight is required and must be greater than 0.');
    if (images.length === 0) return setError('At least one product image is required.');

    // Format tags & ingredients
    const tags = tagsInput
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    const ingredients = ingredientsInput
      .split(',')
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 0);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      shortDescription: shortDescription.trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      category,
      stock: Number(stock),
      weight: Number(weight),
      howToUse: howToUse.trim(),
      tags,
      ingredients,
      isActive,
      isFeatured,
      images,
    };

    try {
      const url = isEdit ? `/api/admin/products/${productId}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save product.');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">

      {/* Header and Go-back link */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="p-2 border border-stone-200 rounded-md bg-white hover:bg-stone-50 transition-colors text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {isEdit ? `Modifying properties of ${initialData?.name}` : 'Populate properties to publish a new product catalog item.'}
          </p>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form Details & Media */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card: Basic Properties */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Basic Details
            </h2>

            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Organic Henna Paste Cone"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
                required
              />
            </div>

            {/* Short Description */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="shortDescription" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] ${shortDescription.length > 160 ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                  {shortDescription.length} / 160 chars
                </span>
              </div>
              <textarea
                id="shortDescription"
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A brief summary shown on listing cards (max 160 characters)..."
                maxLength={160}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
                required
              />
            </div>

            {/* Detailed Description */}
            <div className="space-y-1">
              <label htmlFor="description" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full details on product ingredients, benefits, storage instructions, etc..."
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] font-light leading-relaxed"
                required
              />
            </div>
          </div>

          {/* Card: Media Dropzone & Reordering */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
              <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400">
                Product Images
              </h2>
              <span className="text-[10px] text-stone-400 italic">
                Drag images to reorder. First image is the main cover.
              </span>
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={handleUploaderDrag}
              onDragOver={handleUploaderDrag}
              onDragLeave={handleUploaderDrag}
              onDrop={handleUploaderDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${isDragActive
                ? 'border-[#8B3A2A] bg-[#8B3A2A]/5'
                : 'border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-400'
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-[#8B3A2A] animate-spin" />
                  <p className="text-xs text-stone-500 font-bold">Uploading files to Cloudinary...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-stone-400" />
                  <p className="text-xs text-stone-500">
                    <span className="font-bold text-[#8B3A2A]">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[10px] text-stone-400">PNG, JPG, WEBP formats up to 5MB</p>
                </>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded px-3 py-1.5 flex items-center gap-1.5">
                <span>{uploadError}</span>
              </p>
            )}

            {/* Thumbnail Grid & Native Drag to Reorder */}
            {images.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Uploaded Images ({images.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((img, index) => {
                    const isDragged = draggedIndex === index;
                    const isDragOver = dragOverIndex === index;

                    return (
                      <div
                        key={img.publicId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOverItem(e, index)}
                        onDrop={(e) => handleDropItem(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`border rounded-lg p-3 bg-white flex flex-col justify-between transition-all select-none ${isDragged ? 'opacity-40 border-dashed border-[#8B3A2A]' : 'border-stone-200'
                          } ${isDragOver ? 'border-[#8B3A2A] scale-[1.02] shadow-sm bg-stone-50/50' : ''
                          }`}
                      >
                        {/* Header handle + delete */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-700">
                            <GripVertical size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {index === 0 ? 'Cover Image' : `Image ${index + 1}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 rounded bg-stone-50 text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {/* Thumbnail View */}
                        <div className="h-32 w-full bg-stone-50 rounded border border-stone-100 flex items-center justify-center overflow-hidden mb-3">
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* Alt text field */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                            Alt text (Accessibility)
                          </label>
                          <input
                            type="text"
                            value={img.alt}
                            onChange={(e) => handleAltTextChange(index, e.target.value)}
                            placeholder="Describe this image..."
                            className="w-full px-2 py-1 text-[11px] border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card: Extensible Detail Elements */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Advanced Content
            </h2>

            {/* How To Use */}
            <div className="space-y-1">
              <label htmlFor="howToUse" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                How to Use
              </label>
              <textarea
                id="howToUse"
                rows={3}
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="Application steps, dry time, aftercare advice..."
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] font-light"
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-1">
              <label htmlFor="ingredients" className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1">
                <span>Ingredients</span>
                <HelpCircle size={12} className="text-stone-400" aria-label="Separate items with commas" />
              </label>
              <input
                id="ingredients"
                type="text"
                value={ingredientsInput}
                onChange={(e) => setIngredientsInput(e.target.value)}
                placeholder="e.g. Natural Henna Powder, Eucalyptus Oil, Lemon Juice"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
              />
              <span className="text-[10px] text-stone-400 italic">Separate ingredients with commas.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Inventory, Classification, Status */}
        <div className="space-y-6">

          {/* Card: Status & Visibility */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Publish Status
            </h2>

            <div className="space-y-3">
              {/* Active */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-[#8B3A2A] focus:ring-[#8B3A2A]"
                />
                <div>
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">Active</span>
                  <p className="text-[10px] text-stone-400 mt-0.5">Allow users to search and purchase this item in store catalog.</p>
                </div>
              </label>

              {/* Featured */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-[#8B3A2A] focus:ring-[#8B3A2A]"
                />
                <div>
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">Featured</span>
                  <p className="text-[10px] text-stone-400 mt-0.5">Highlight this product in home grids or recommendations.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Card: Pricing */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Pricing (INR)
            </h2>

            {/* Price */}
            <div className="space-y-1">
              <label htmlFor="price" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Sales Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="999.00"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
                required
              />
            </div>

            {/* Compare At Price */}
            <div className="space-y-1">
              <label htmlFor="compareAtPrice" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Original Price (₹)
              </label>
              <input
                id="compareAtPrice"
                type="number"
                min="0"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="1299.00"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
              />
              <span className="text-[10px] text-stone-400 italic">Optional. Show strike-through discounts.</span>
            </div>
          </div>

          {/* Card: Inventory & Metrics */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Inventory & Shipping
            </h2>

            {/* Stock */}
            <div className="space-y-1">
              <label htmlFor="stock" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
                required
              />
            </div>

            {/* Weight */}
            <div className="space-y-1">
              <label htmlFor="weight" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Weight (Grams) <span className="text-red-500">*</span>
              </label>
              <input
                id="weight"
                type="number"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="150"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
                required
              />
              <span className="text-[10px] text-stone-400 italic">Required for package weight estimation.</span>
            </div>
          </div>

          {/* Card: Categories & Tags */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
              Classifications
            </h2>

            {/* Category */}
            <div className="space-y-1">
              <label htmlFor="category" className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A] bg-white cursor-pointer"
                required
              >
                <option value="henna-cones">Henna Cones</option>
                <option value="powders">Powders</option>
                <option value="kits">Kits</option>
                <option value="accessories">Accessories</option>
                <option value="masks">Masks</option>
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label htmlFor="tags" className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1">
                <span>Tags</span>
                <HelpCircle size={12} className="text-stone-400" aria-label="Separate tags with commas" />
              </label>
              <input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. natural, organic, fresh, bridal"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:border-[#8B3A2A]"
              />
              <span className="text-[10px] text-stone-400 italic">Separate items with commas.</span>
            </div>
          </div>

        </div>

      </div>

      {/* Sticky Bottom Actions footer */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-200">
        <button
          type="button"
          disabled={saving}
          onClick={() => router.push('/admin/products')}
          className="px-6 py-2.5 border border-stone-200 rounded text-xs font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#8B3A2A] text-white hover:bg-[#722F22] rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow disabled:opacity-50"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
        </button>
      </div>

    </form>
  );
}
