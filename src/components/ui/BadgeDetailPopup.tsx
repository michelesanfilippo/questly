'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';

interface BadgeDetailPopupProps {
  badgeName: string;
  badgeDescription: string;
  badgeImagePath: string;
  isProfileBadge: boolean;
  onSetAsProfile: () => void;
  onClose: () => void;
}

export function BadgeDetailPopup({ badgeName, badgeDescription, badgeImagePath, isProfileBadge, onSetAsProfile, onClose }: BadgeDetailPopupProps) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <AnimatePresence>
        <motion.div
          key="badge-detail"
          className="relative w-full max-w-xs bg-[#faf7f0] border-2 border-amber-800/30 rounded-sm shadow-[2px_4px_16px_rgba(101,67,33,0.25)] p-8 text-center"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800/40" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800/40" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800/40" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800/40" />

          <button onClick={onClose} className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 transition-colors text-lg leading-none">&#x2715;</button>

          <div className="flex justify-center mb-4">
            <Image src={badgeImagePath} alt={badgeName} width={110} height={110} className="rounded-full shadow-[0_0_20px_rgba(217,119,6,0.4)]" />
          </div>

          <h2 className="font-serif text-xl font-bold text-amber-900 mb-1">{badgeName}</h2>
          <p className="text-sm text-stone-600 italic mb-5">{badgeDescription}</p>

          <button
            onClick={() => { onSetAsProfile(); onClose(); }}
            className={`w-3/4 mx-auto block min-h-[38px] rounded-sm font-semibold text-sm border transition-all duration-150 ${
              isProfileBadge
                ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                : 'bg-amber-700 hover:bg-amber-800 text-amber-50 border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)]'
            }`}
            disabled={isProfileBadge}
          >
            {isProfileBadge ? t('badge.current_profile') : t('badge.set_profile')}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
