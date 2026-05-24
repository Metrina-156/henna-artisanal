'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageType {
  url: string;
  publicId: string;
  alt: string;
}

interface ProductGalleryProps {
  images: ImageType[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-stone-200 rounded-lg flex items-center justify-center text-stone-400">
        No Images Available
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="space-y-6">
      {/* Main Large Image Viewport */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#F5EFE6]/50 border border-amber-900/5 shadow-inner">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full relative"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt || productName}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail Rows */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-900/10">
          {images.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={img.publicId || idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-24 flex-shrink-0 rounded-md overflow-hidden bg-[#F5EFE6]/30 border-2 transition-all duration-300 ${
                  isActive ? 'border-[#8B3A2A] shadow-md scale-95' : 'border-transparent hover:border-[#8B3A2A]/40'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${productName} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
