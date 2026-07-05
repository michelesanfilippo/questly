'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgeUnlockPopupProps {
  nickname: string;
  badgeName: string;
  badgeDescription: string;
  badgeImagePath: string;
  onClose: () => void;
}

export function BadgeUnlockPopup({ nickname, badgeName, badgeDescription, badgeImagePath, onClose }: BadgeUnlockPopupProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <AnimatePresence>
        <motion.div
          key="badge-popup"
          className="relative w-full max-w-sm bg-[#faf7f0] border-2 border-amber-800/30 rounded-sm shadow-[2px_4px_16px_rgba(101,67,33,0.25)] p-8 text-center"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Corner decorations */}
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800/40" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800/40" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800/40" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800/40" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            &#x2715;
          </button>

          {/* Badge image */}
          <div className="flex justify-center mb-4">
            <Image
              src={badgeImagePath}
              alt={badgeName}
              width={80}
              height={80}
              className="rounded-full shadow-[0_0_16px_rgba(217,119,6,0.4)]"
            />
          </div>

          {/* Text */}
          <p className="text-xs uppercase tracking-widest text-amber-700/70 mb-2 font-semibold">
            Badge Unlocked
          </p>
          <h2 className="font-serif text-xl font-bold text-amber-900 mb-1">
            {badgeName}
          </h2>
          <p className="text-sm text-stone-600 italic mb-4">
            {badgeDescription}
          </p>
          <p className="text-sm text-stone-700">
            Congratulations, <span className="font-semibold font-serif text-amber-800">{nickname}</span>!
          </p>

          {/* CTA */}
          <button
            onClick={onClose}
            className="mt-5 w-3/4 mx-auto block min-h-[38px] rounded-sm bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold text-sm border border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] transition-all duration-150"
          >
            Claim
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
