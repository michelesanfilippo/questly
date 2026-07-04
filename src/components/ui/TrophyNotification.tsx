'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrophyNotificationProps {
  trophyName: string;
  onDismiss: () => void;
}

export function TrophyNotification({ trophyName, onDismiss }: TrophyNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        key="trophy-notification"
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-4 right-4 z-50 bg-slate-800/95 border border-amber-500/50 rounded-lg p-4 shadow-xl max-w-xs"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden="true">&#11088;</span>
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide">
              Trophy Unlocked!
            </p>
            <p className="text-sm text-slate-100 font-medium mt-0.5">{trophyName}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
