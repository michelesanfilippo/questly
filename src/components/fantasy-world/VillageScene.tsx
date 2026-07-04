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
      style={{ top: '15%', left: '-10%' }}
      initial={{ x: 0, y: 0, opacity: 1 }}
      animate={{ x: '120vw', y: '60vh', opacity: 0 }}
      transition={{ duration: 1.1, ease: 'easeIn' }}
      onAnimationComplete={onDone}
    >
      <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_6px_3px_rgba(255,255,255,0.8)]" />
      <div
        className="absolute top-0 right-1 w-16 h-0.5 origin-right"
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
      animate={{ scale: [0, 1.5, 1], opacity: [0, 0.9, 0] }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 bg-amber-300/80 rounded-full origin-bottom"
          style={{
            height: '80px',
            bottom: '50%',
            left: 'calc(50% - 2px)',
            transform: `rotate(${i * 45}deg) translateY(-100%)`,
          }}
        />
      ))}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-300/70 blur-sm" />
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
    <div className="relative w-full h-full overflow-hidden">
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
            src={isDark ? '/images/village-night-16-9.png' : '/images/village-day-16-9.png'}
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

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Logo — top left */}
      <div className="absolute top-4 left-4 z-20">
        <Image
          src="/images/questly-removebg-preview.png"
          alt="Questly"
          width={44}
          height={44}
          className="drop-shadow-lg"
        />
      </div>
    </div>
  );
}
