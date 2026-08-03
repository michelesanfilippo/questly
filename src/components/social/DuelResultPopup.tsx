'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';
import type { DuelData } from './DuelChallengePopup';

interface DuelResultPopupProps {
  duel: DuelData;
  currentUserId: string;
  onClose: () => void;
}

export function DuelResultPopup({ duel, currentUserId, onClose }: DuelResultPopupProps) {
  const { t } = useI18n();

  const isChallenger = duel.challenger_id === currentUserId;
  const myScore = isChallenger ? (duel.challenger_score ?? 0) : (duel.challenged_score ?? 0);
  const opponentScore = isChallenger ? (duel.challenged_score ?? 0) : (duel.challenger_score ?? 0);
  const isWinner = duel.winner_id === currentUserId;
  const isDraw = duel.winner_id === null;

  const resultLabel = isDraw ? t('duel.draw') : isWinner ? t('duel.you_won') : t('duel.you_lost');
  const resultColor = isDraw
    ? 'text-amber-700'
    : isWinner
    ? 'text-emerald-700'
    : 'text-red-700';

  const bgFrom = isDraw
    ? 'from-amber-50'
    : isWinner
    ? 'from-emerald-50'
    : 'from-red-50';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-sm"
        >
          <div className={`rounded-sm border-2 border-amber-800/50 bg-gradient-to-b ${bgFrom} to-[#faf7f0] shadow-[4px_8px_24px_rgba(101,67,33,0.35)] overflow-hidden`}>
            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-700/50 rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-700/50 rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-700/50 rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-700/50 rounded-br-sm" />

            <div className="p-6 space-y-5">
              {/* Title */}
              <div className="text-center">
                <h2 className="font-serif text-lg font-bold text-amber-900 mb-2">
                  {t('duel.result_title')}
                </h2>
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  className={`text-3xl font-bold font-serif ${resultColor}`}
                >
                  {resultLabel}
                </motion.p>
              </div>

              {/* Scoreboard */}
              <div className="rounded-sm bg-white/70 border border-amber-200/60 p-4 space-y-3">
                {/* VS header */}
                <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-wider text-stone-400">
                  <span className="truncate text-right flex-1">Tu</span>
                  <span className="text-amber-600">{t('duel.vs')}</span>
                  <span className="truncate flex-1">{duel.opponent_nickname}</span>
                </div>

                {/* Scores */}
                <div className="flex items-center justify-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center flex-1"
                  >
                    <p className={`text-4xl font-bold ${isWinner ? 'text-emerald-700' : isDraw ? 'text-amber-700' : 'text-stone-700'}`}>
                      {myScore}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">{t('duel.your_score')}</p>
                  </motion.div>

                  <div className="text-2xl font-bold text-amber-400/60">—</div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center flex-1"
                  >
                    <p className={`text-4xl font-bold ${!isWinner && !isDraw ? 'text-emerald-700' : 'text-stone-700'}`}>
                      {opponentScore}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {t('duel.opponent_score', { nickname: duel.opponent_nickname })}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* XP reward */}
              {isWinner && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-sm bg-amber-100/80 border border-amber-300/60 p-3 text-center"
                >
                  <p className="text-sm font-bold text-amber-800">{t('duel.xp_reward')}</p>
                </motion.div>
              )}

              {/* Quest info */}
              <p className="text-center text-xs text-stone-500 italic">
                {duel.mission_snapshot?.title}
              </p>

              {/* Close */}
              <button
                onClick={onClose}
                className="block w-3/4 mx-auto min-h-[40px] rounded-sm bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold text-sm border border-amber-600 transition-colors"
              >
                {t('duel.close')}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
