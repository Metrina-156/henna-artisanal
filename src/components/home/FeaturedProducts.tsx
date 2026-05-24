'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import products from '@/data/products.json';
import { ShoppingBag } from 'lucide-react';
import { usePersistedStore } from '@/store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PEXELS_HENNA = "https://images.pexels.com/photos/3762497/pexels-photo-3762497.jpeg?auto=compress&cs=tinysrgb&w=800";

export default function FeaturedProducts() {
  const addToCart = usePersistedStore((state) => state.addToCart);

  return (
    <section className="py-24 md:py-48 px-6 md:px-12 bg-sandstone/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div className="max-w-xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs uppercase tracking-[0.3em] font-bold text-terracotta mb-6 block"
            >
              The Collection
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif text-henna-deep leading-tight"
            >
              Hand-Pressed <br />
              <span className="italic">Botanical</span> Essences
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/products" className="text-xs uppercase tracking-widest font-bold border-b border-henna-deep pb-2 hover:text-terracotta hover:border-terracotta transition-all">
              View All Products
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-start">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={cn(
                "group relative md:col-span-6 lg:col-span-4",
                index === 1 && "md:translate-y-24",
                index === 2 && "lg:col-span-4",
                index === 3 && "lg:col-span-8 md:translate-y-24 lg:translate-y-0 lg:pt-32"
              )}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-warm-cream/50 mb-8">
                <div className="w-full h-full relative transition-transform duration-700 group-hover:scale-105">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div className="absolute inset-0 bg-henna-deep/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={() => addToCart({ ...product, quantity: 1 })}
                    className="bg-warm-cream text-henna-deep px-8 py-4 text-xs uppercase tracking-widest font-bold shadow-xl pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                  >
                    Quick Add
                  </button>
                </div>

                <div className="absolute top-6 left-6">
                  <span className="bg-warm-cream/90 backdrop-blur-sm px-4 py-1 text-[10px] uppercase tracking-widest font-bold text-henna-deep">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-serif text-henna-deep mb-2">
                    <Link href={`/product/${product.id}`} className="hover:text-terracotta transition-colors">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-henna-deep/50 uppercase tracking-widest mb-4">{product.texture}</p>
                </div>
                <p className="text-lg font-medium text-terracotta">${product.price.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
