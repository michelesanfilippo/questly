'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';

interface WelcomePopupProps {
  onClose: () => void;
}

export function WelcomePopup({ onClose }: WelcomePopupProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          key="welcome-popup"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-sm bg-[#fdf8ee] shadow-[4px_8px_24px_rgba(101,67,33,0.35)]"
          style={{
            border: '2px solid rgba(101,67,33,0.35)',
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(180,130,60,0.07) 28px)',
          }}
        >
          {/* Parchment top tear */}
          <div
            className="w-full h-3 rounded-t-sm"
            style={{
              background:
                'linear-gradient(90deg,#c9a96e 0%,#e8d5a3 20%,#d4b97a 40%,#f0e0b0 60%,#c9a96e 80%,#e2ca8f 100%)',
              opacity: 0.7,
            }}
          />

          {/* Corner ornaments */}
          <span className="absolute top-5 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-800/40 pointer-events-none" />
          <span className="absolute top-5 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-800/40 pointer-events-none" />
          <span className="absolute bottom-5 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-800/40 pointer-events-none" />
          <span className="absolute bottom-5 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-800/40 pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 transition-colors text-lg leading-none z-10"
            aria-label="Close"
          >
            &#x2715;
          </button>

          <div className="px-8 py-7 text-center">
            {/* Decorative icon */}
            <div className="text-4xl mb-3 select-none">📜</div>

            {/* Title */}
            <h2 className="font-serif text-2xl font-bold text-amber-900 mb-1 leading-tight">
              {t('welcome.title')}
            </h2>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-2 my-3">
              <span className="flex-1 h-px bg-amber-800/20" />
              <span className="text-amber-700/50 text-xs">✦</span>
              <span className="flex-1 h-px bg-amber-800/20" />
            </div>

            {/* Description */}
            <p className="text-sm text-stone-700 leading-relaxed mb-4">
              {t('welcome.description')}
            </p>

            {/* Badge hint */}
            <div className="rounded-sm border border-amber-700/25 bg-amber-50/70 px-4 py-3 mb-5">
              <span className="text-base mr-1.5">🏅</span>
              <span className="text-sm text-amber-900 font-medium italic">
                {t('welcome.badge_hint')}
              </span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onClose}
              className="w-3/4 mx-auto block min-h-[40px] rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-semibold text-sm border border-amber-600/60 shadow-[1px_2px_6px_rgba(101,67,33,0.3)] transition-all duration-150"
            >
              {t('welcome.close')}
            </button>
          </div>

          {/* Parchment bottom tear */}
          <div
            className="w-full h-3 rounded-b-sm"
            style={{
              background:
                'linear-gradient(90deg,#e2ca8f 0%,#c9a96e 20%,#f0e0b0 40%,#d4b97a 60%,#e8d5a3 80%,#c9a96e 100%)',
              opacity: 0.7,
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
