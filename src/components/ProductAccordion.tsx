'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductAccordionProps {
  description: string;
  ingredients: string[];
  howToUse: string;
  weight: number;
}

export default function ProductAccordion({
  description,
  ingredients,
  howToUse,
  weight,
}: ProductAccordionProps) {
  const [openSection, setOpenSection] = useState<string | null>('description');

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const sections = [
    {
      id: 'description',
      title: 'The Story & Ritual',
      content: (
        <p className="text-sm font-light text-amber-950/70 leading-relaxed">
          {description}
        </p>
      ),
    },
    {
      id: 'ingredients',
      title: 'Pure Ingredients',
      content: ingredients.length > 0 ? (
        <ul className="list-disc list-inside space-y-2 text-sm font-light text-amber-950/70">
          {ingredients.map((item, index) => (
            <li key={index} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm font-light text-amber-950/70">No ingredients specified.</p>
      ),
    },
    {
      id: 'how-to-use',
      title: 'Application Ritual',
      content: (
        <p className="text-sm font-light text-amber-950/70 leading-relaxed whitespace-pre-line">
          {howToUse || 'Apply gently as desired.'}
        </p>
      ),
    },
    {
      id: 'shipping',
      title: 'Artisanal Fresh Shipping',
      content: (
        <div className="space-y-3 text-sm font-light text-amber-950/70 leading-relaxed">
          <p>
            <strong>Product Weight:</strong> {weight}g
          </p>
          <p>
            Because our fresh cones contain active, preservative-free organic henna paste, they are shipped with cold packs. We process orders on Mondays and Tuesdays to avoid weekend transit delays.
          </p>
          <p>
            Store cones in the freezer immediately upon receipt to preserve dye potency. Cones thaw in just 15 minutes at room temperature.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="border-t border-amber-950/10 divide-y divide-amber-950/10">
      {sections.map((sec) => {
        const isOpen = openSection === sec.id;
        return (
          <div key={sec.id} className="py-4">
            <button
              onClick={() => toggleSection(sec.id)}
              className="w-full flex items-center justify-between font-serif text-base text-amber-950 font-bold hover:text-[#8B3A2A] transition-colors py-2 text-left"
              aria-expanded={isOpen}
            >
              <span>{sec.title}</span>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-2 pr-4">
                    {sec.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
