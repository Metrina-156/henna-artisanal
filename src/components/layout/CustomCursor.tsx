'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only enable for fine pointers (mouse/trackpad)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setEnabled(mediaQuery.matches);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    if (mediaQuery.matches) {
      window.addEventListener('mousemove', moveCursor);
    }

    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, [cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[999] mix-blend-difference"
      style={{
        translateX: springX,
        translateY: springY,
        x: '-50%',
        y: '-50%',
      }}
    >
      <div className="w-full h-full rounded-full border border-warm-cream flex items-center justify-center">
        <div className="w-1 h-1 bg-terracotta rounded-full" />
      </div>
    </motion.div>
  );
}
