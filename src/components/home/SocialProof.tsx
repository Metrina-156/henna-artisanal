'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import galleryItems from '@/data/gallery.json';

export default function SocialProof() {
  return (
    <section className="py-24 md:py-48 px-6 md:px-12 bg-warm-cream">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] font-bold text-terracotta mb-6 block"
          >
            The Community
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif text-henna-deep mb-8"
          >
            Shared <span className="italic">Rituals</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm text-henna-deep/60 max-w-xl mx-auto"
          >
            A curated gallery of artistry and self-care moments from our global circle of artists and enthusiasts.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={cn(
                "relative overflow-hidden rounded-lg group aspect-square",
                index % 3 === 0 && "md:aspect-[3/4] md:row-span-2",
                index % 5 === 0 && "md:aspect-[4/3] md:col-span-2"
              )}
            >
              <div className="w-full h-full relative transition-transform duration-1000 group-hover:scale-110">
                <Image 
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
              <div className="absolute inset-0 bg-henna-deep/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button className="px-10 py-4 border border-henna-deep/20 text-henna-deep text-xs uppercase tracking-widest font-bold hover:bg-henna-deep hover:text-warm-cream transition-all duration-300">
            Join the Gallery @artisanalhenna
          </button>
        </div>
      </div>
    </section>
  );
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
