'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Leaf, Heart, Recycle } from 'lucide-react';

const values = [
  {
    icon: Leaf,
    title: "100% Organic",
    description: "Sourced from sustainable family farms in Rajasthan."
  },
  {
    icon: ShieldCheck,
    title: "Chemical Free",
    description: "No PPD, ammonia, or metallic salts. Ever."
  },
  {
    icon: Heart,
    title: "Handmade Batch",
    description: "Prepared in small quantities for peak freshness."
  },
  {
    icon: Recycle,
    title: "Sustainable",
    description: "Compostable packaging and minimal waste."
  }
];

export default function ExperienceAndTrust() {
  return (
    <section className="py-24 px-6 md:px-12 bg-warm-cream">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-sandstone/30 flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                <value.icon className="text-terracotta" size={28} />
              </div>
              <h3 className="font-serif text-xl text-henna-deep mb-4">{value.title}</h3>
              <p className="text-sm text-henna-deep/60 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
