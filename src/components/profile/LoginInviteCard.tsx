'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';

export function LoginInviteCard() {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-[#faf7f0] border-2 border-amber-800/30 rounded-sm shadow-[2px_4px_12px_rgba(101,67,33,0.15)] p-6 flex flex-col items-center text-center gap-4"
    >
      <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-700/40" />
      <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-700/40" />
      <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-700/40" />
      <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-700/40" />

      <span className="text-4xl select-none">⚔️</span>

      <h3 className="font-serif font-bold text-amber-900 text-base leading-snug">
        {t('user.login_prompt_title')}
      </h3>

      <p className="text-xs text-stone-500 leading-relaxed">
        {t('user.login_prompt_sub')}
      </p>
    </motion.div>
  );
}
