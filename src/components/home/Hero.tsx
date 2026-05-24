'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Verified stable Pexels URL for artisanal/earthy vibe
const PEXELS_HERO = "https://images.unsplash.com/photo-1530785404354-f4ed0206a0d1?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parallax effect on image
    gsap.to(imageRef.current, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // Subtle fade and move on title
    gsap.to(titleRef.current, {
      y: -50,
      opacity: 0.5,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-[100vh] w-full overflow-hidden flex items-center justify-center"
    >
      {/* Background Image with Parallax */}
      <div
        ref={imageRef}
        className="absolute inset-0 z-0 h-[120%]"
      >
        <div
          className="absolute inset-0 z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        /> {/* Overlay */}
        <Image src={PEXELS_HERO}
          alt="Artisanal Henna Ritual"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[13px] md:text-sm uppercase tracking-[0.3em] font-bold text-warm-cream/80 mb-6 block">
            Pure. Natural. Artisanal.
          </span>
          <h1
            ref={titleRef}
            className="text-8xl md:text-8xl lg:text-9xl font-serif text-warm-cream tracking-tighter mb-8 leading-[0.9]"
          >
            Tradition <br />
            <span className="italic">Crafted</span> by Hand
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <Link
              href="/products"
              className="px-10 py-4 bg-muted-gold text-henna-deep text-sm uppercase tracking-widest font-bold hover:bg-warm-cream transition-colors duration-300"
            >
              Shop the Collection
            </Link>
            <Link
              href="/products"
              className="px-10 py-4 border border-warm-cream/30 text-warm-cream text-sm uppercase tracking-widest font-bold hover:bg-warm-cream hover:text-henna-deep transition-all duration-300"
            >
              Browse Products
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-warm-cream/90">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-warm-cream/80 to-transparent" />
        </div>
      </div>
    </section>
  );
}
