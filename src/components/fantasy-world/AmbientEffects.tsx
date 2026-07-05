'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

const ORBS = [
  { top: '10%', left: '20%', size: 180, delay: 0 },
  { top: '5%', left: '60%', size: 120, delay: 1.2 },
  { top: '30%', left: '80%', size: 100, delay: 0.6 },
];

export function AmbientEffects() {
  const orbs = useMemo(() => ORBS, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
