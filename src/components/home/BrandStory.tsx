'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const PEXELS_HENNA = "https://images.pexels.com/photos/3762497/pexels-photo-3762497.jpeg?auto=compress&cs=tinysrgb&w=1200";

export default function BrandStory() {
  return (
    <section className="py-24 md:py-48 px-6 md:px-12 bg-warm-cream overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Image Collage Side */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative aspect-[4/5] w-full max-w-md mx-auto z-10 overflow-hidden rounded-lg shadow-2xl"
            >
              <Image
                src={"https://i.pinimg.com/1200x/1e/c5/93/1ec593422e1c5129a6725414de0a0bad.jpg"}
                alt="Artisanal Henna Preparation"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="absolute -bottom-12 -right-6 md:-right-12 aspect-square w-48 md:w-64 z-20 overflow-hidden rounded-lg shadow-xl hidden sm:block"
            >
              <Image
                src={"https://images.unsplash.com/photo-1556536088-f010a312a8d3?q=80&w=388&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                alt="Close up of Henna Pattern"
                fill
                className="object-cover"
                sizes="25vw"
              />
            </motion.div>

            {/* Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-terracotta/10 rounded-full -z-10" />
          </div>

          {/* Text Content Side */}
          <div className="flex flex-col justify-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs uppercase tracking-[0.3em] font-bold text-terracotta mb-6 block"
            >
              Our Heritage
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif text-henna-deep mb-10 leading-tight"
            >
              Rooted in <br />
              <span className="italic">Ancient</span> Rituals
            </motion.h2>

            <div className="space-y-8 text-henna-deep/80 leading-relaxed">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                At Artisanal Henna, we believe beauty is a meditative process, not a destination. Our journey began in a small home studio, fueled by a desire to preserve the slow, handmade traditions of henna preparation that are being lost to mass production.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Each cone is hand-rolled and filled with a paste that takes 48 hours to perfect. We source our leaves from sustainable family farms in Rajasthan, ensuring every batch is as pure as nature intended.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="pt-8"
              >
                <blockquote className="font-decorative text-3xl text-terracotta border-l-2 border-terracotta/20 pl-8 py-2">
                  "Henna is the language of the soul, written on the skin."
                </blockquote>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
