'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';
import type { Mission } from '@/types';

export interface DuelData {
  id: string;
  status: string;
  challenger_id: string;
  challenged_id: string;
  mission_id: string;
  mission_snapshot: Mission;
  challenger_answer: string | null;
  challenger_score: number | null;
  challenged_answer: string | null;
  challenged_score: number | null;
  winner_id: string | null;
  opponent_id: string;
  opponent_nickname: string;
  is_challenger: boolean;
  created_at: string;
}

interface DuelChallengePopupProps {
  duel: DuelData;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function DuelChallengePopup({ duel, onAccept, onDecline, isLoading }: DuelChallengePopupProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-sm"
        >
          {/* Parchment */}
          <div className="rounded-sm border-2 border-amber-800/50 bg-[#faf7f0] shadow-[4px_8px_24px_rgba(101,67,33,0.35)] overflow-hidden">
            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-700/50 rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-700/50 rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-700/50 rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-700/50 rounded-br-sm" />

            <div className="p-6 space-y-4">
              {/* Icon + Title */}
              <div className="text-center">
                <div className="text-5xl mb-2">⚔️</div>
                <h2 className="font-serif text-xl font-bold text-amber-900">
                  {t('duel.new_challenge_title')}
                </h2>
              </div>

              {/* Challenge text */}
              <div className="rounded-sm bg-amber-50/80 border border-amber-200/60 p-4 text-center">
                <p className="text-sm text-stone-700 font-semibold">
                  {t('duel.new_challenge_text', { challenger: duel.opponent_nickname })}
                </p>
                <p className="mt-2 text-xs text-stone-500 italic">
                  {t('duel.scroll_flavor')}
                </p>
              </div>

              {/* Mission preview */}
              <div className="rounded-sm bg-amber-100/50 border border-amber-200/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-1">
                  {t('duel.quest_label')}
                </p>
                <p className="text-sm font-serif font-bold text-amber-900">
                  {duel.mission_snapshot?.title ?? '—'}
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onDecline}
                  disabled={isLoading}
                  className="flex-1 rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-50"
                >
                  {isLoading ? t('duel.declining') : t('duel.decline')}
                </button>
                <button
                  onClick={onAccept}
                  disabled={isLoading}
                  className="flex-1 rounded-sm border border-amber-600 bg-amber-700 px-4 py-2.5 text-sm font-bold text-amber-50 transition-colors hover:bg-amber-800 disabled:opacity-50"
                >
                  {isLoading ? t('duel.accepting') : t('duel.accept')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
