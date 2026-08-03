'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';
import { useQuestTranslation } from '@/hooks/useQuestTranslation';
import type { Mission } from '@/types';
import type { DuelData } from './DuelChallengePopup';

interface DuelQuestModalProps {
  duel: DuelData;
  onSubmit: (answer: string) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function DuelQuestModal({ duel, onSubmit, onClose, isSubmitting }: DuelQuestModalProps) {
  const { t, locale } = useI18n();
  const [answer, setAnswer] = useState('');
  const mission = duel.mission_snapshot as Mission;
  const { translated, translating } = useQuestTranslation(mission, locale);

  const trimmedLen = answer.trim().length;
  const isValid = trimmedLen >= 10;

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;
    await onSubmit(answer.trim());
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm overflow-y-auto py-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl"
        >
          {/* Parchment */}
          <div className="rounded-sm border-2 border-amber-800/50 bg-[#faf7f0] shadow-[4px_8px_24px_rgba(101,67,33,0.35)]">
            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-700/50 rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-700/50 rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-700/50 rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-700/50 rounded-br-sm" />

            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-amber-200/60 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
                    {t('duel.vs')} {duel.opponent_nickname}
                  </p>
                  <h2 className="font-serif text-xl font-bold text-amber-900">
                    {translated?.title ?? mission.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="shrink-0 text-stone-400 hover:text-stone-600 disabled:opacity-50 text-xl leading-none mt-0.5"
                >
                  ×
                </button>
              </div>

              {/* Quest body */}
              {translating ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-4xl select-none"
                  >
                    🧙
                  </motion.div>
                  <p className="text-xs text-amber-700/70 font-serif italic">
                    {t('boss.panel.wizards_working')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {translated?.narrativeDescription && (
                    <p className="text-sm text-stone-600 italic leading-relaxed">
                      {translated.narrativeDescription}
                    </p>
                  )}
                  <div className="rounded-sm bg-amber-50/80 border border-amber-200/60 p-4">
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {translated?.task ?? mission.task}
                    </p>
                  </div>
                </div>
              )}

              {/* Answer textarea */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  {t('duel.quest_label')}
                </p>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  disabled={isSubmitting}
                  placeholder={t('duel.answer_placeholder')}
                  rows={5}
                  className="w-full min-h-[120px] rounded-sm border-2 bg-[#faf7f0] text-stone-800 placeholder-stone-400 border-amber-300/60 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all duration-200 disabled:opacity-50"
                />
                {trimmedLen > 0 && trimmedLen < 10 && (
                  <p className="text-xs text-red-600">{t('duel.answer_min')}</p>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="block w-3/4 mx-auto min-h-[40px] rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-bold text-sm border border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-4 h-4 border-2 border-amber-200/30 border-t-amber-100 rounded-full"
                    />
                    {t('duel.submitting')}
                  </span>
                ) : t('duel.submit')}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
