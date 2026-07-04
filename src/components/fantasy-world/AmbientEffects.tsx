'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Deterministic positions — no Math.random on render (SSR-safe)
const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  top: `${((i * 37 + 11) % 65) + 3}%`,
  left: `${((i * 53 + 7) % 95) + 2}%`,
  delay: (i * 0.23) % 3,
  size: i % 4 === 0 ? 3 : 2,
}));

const ORBS = [
  { top: '10%', left: '20%', size: 180, delay: 0 },
  { top: '5%', left: '60%', size: 120, delay: 1.2 },
  { top: '30%', left: '80%', size: 100, delay: 0.6 },
];

export function AmbientEffects() {
  const stars = useMemo(() => STARS, []);
  const orbs = useMemo(() => ORBS, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Dark mode: twinkling stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white opacity-0 dark:opacity-70"
          style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
          animate={{ opacity: [0, 0.7, 0.2, 0.7, 0] }}
          transition={{ duration: 3, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Light mode: warm dawn glow orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-20 dark:opacity-0 blur-3xl"
          style={{
            top: orb.top,
            left: orb.left,
            width: orb.size,
            height: orb.size,
            background: 'radial-gradient(circle, #FCD34D, #F97316, transparent)',
          }}
          animate={{ y: [0, -12, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Dark mode: moon glow */}
      <motion.div
        className="absolute top-6 right-12 w-24 h-24 rounded-full opacity-0 dark:opacity-15 blur-2xl"
        style={{ background: 'radial-gradient(circle, #A78BFA, transparent)' }}
        animate={{ opacity: [0, 0.15, 0.08, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
