'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { AmbientEffects } from './AmbientEffects';

// Shooting star for dark→light transition
function ShootingStar({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-30"
      style={{ top: '2%', left: '-8%' }}
      initial={{ x: 0, y: 0, opacity: 1 }}
      animate={{ x: '130vw', y: '90vh', opacity: 0 }}
      transition={{ duration: 3.0, ease: 'easeIn' }}
      onAnimationComplete={onDone}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_3px_rgba(255,255,255,0.8)]" />
      <div
        className="absolute top-0 right-1 w-28 h-0.5 origin-right"
        style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.8), transparent)' }}
      />
    </motion.div>
  );
}

// Sun rays burst for dark→light transition
function SunBurst({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 2, 1.5, 0], opacity: [0, 0.8, 0.6, 0] }}
      transition={{ duration: 2.0, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-amber-200/60 blur-2xl" />
    </motion.div>
  );
}

export function VillageScene() {
  const [isDark, setIsDark] = useState(false);
  const [showShootingStar, setShowShootingStar] = useState(false);
  const [showSunBurst, setShowSunBurst] = useState(false);
  const prevDark = useRef(false);

  useEffect(() => {
    const sync = () => {
      const dark = document.documentElement.classList.contains('dark');
      if (dark !== prevDark.current) {
        if (!dark && prevDark.current) {
          // dark → light: sun burst
          setShowSunBurst(true);
        } else if (dark && !prevDark.current) {
          // light → dark: shooting star
          setShowShootingStar(true);
        }
        prevDark.current = dark;
        setIsDark(dark);
      }
    };
    // initial
    const initial = document.documentElement.classList.contains('dark');
    prevDark.current = initial;
    setIsDark(initial);

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Village image — crossfades on theme change */}
      <AnimatePresence mode="sync">
        <motion.div
          key={isDark ? 'night' : 'day'}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <Image
            src={isDark ? '/images/village-night-16-9.jpg' : '/images/village-day-16-9.jpg'}
            alt={isDark ? 'Fantasy village at night' : 'Fantasy village at dawn'}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Ambient overlay effects */}
      <AmbientEffects />

      {/* Transition animations */}
      {showShootingStar && (
        <ShootingStar onDone={() => setShowShootingStar(false)} />
      )}
      {showSunBurst && (
        <SunBurst onDone={() => setShowSunBurst(false)} />
      )}

      {/* Theme toggle — under logo, top left */}
      <div className="absolute top-16 left-4 z-20">
        <ThemeToggle />
      </div>

      {/* Login button — top right */}
      <div className="absolute top-4 right-4 z-20">
        <button className="px-8 py-2 rounded-2xl text-sm font-semibold border backdrop-blur-sm transition-all duration-200 bg-amber-500/20 hover:bg-amber-500/40 active:bg-amber-500/60 text-amber-100 border-amber-400/40 shadow-md">
          Login
        </button>
      </div>

      {/* Logo — top left */}
      <div className="absolute top-4 left-4 z-20">
        <Image
          src="/images/questly-removebg-preview.png"
          alt="Questly"
          width={54}
          height={54}
          className="drop-shadow-lg"
        />
      </div>
    </div>
  );
}
