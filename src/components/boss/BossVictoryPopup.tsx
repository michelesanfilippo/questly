import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BossVictoryPopupProps {
  isOpen: boolean;
  bossName: string;
  bossRarity: number;
  guildXP: number;
  userXP: number;
  top3: { nickname: string; damage: number }[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export const BossVictoryPopup: React.FC<BossVictoryPopupProps> = ({
  isOpen,
  bossName,
  bossRarity,
  guildXP,
  userXP,
  top3,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <AnimatePresence>
        <motion.div
          key="boss-victory"
          className="relative w-full max-w-sm bg-[#faf7f0] border-2 border-amber-800/30 rounded-sm shadow-[2px_4px_16px_rgba(101,67,33,0.25)] p-8 text-center"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800/40" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800/40" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800/40" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800/40" />

          <div className="text-5xl mb-3 select-none">⚔️</div>

          <p className="text-xs uppercase tracking-widest text-amber-700/70 mb-1 font-semibold">Victory</p>
          <h2 className="font-serif text-xl font-bold text-amber-900 mb-1">{bossName} Defeated!</h2>
          <p className="text-sm text-amber-600 mb-5">{'⭐'.repeat(bossRarity)}</p>

          <div className="flex gap-3 justify-center mb-4">
            <div className="flex-1 rounded-sm border border-amber-200 bg-amber-50/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">Guild XP</p>
              <p className="text-xl font-bold text-amber-800">+{guildXP}</p>
            </div>
            <div className="flex-1 rounded-sm border border-amber-200 bg-amber-50/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">Your XP</p>
              <p className="text-xl font-bold text-amber-800">+{userXP}</p>
            </div>
          </div>

          {top3.length > 0 && (
            <div className="mb-5 rounded-sm border border-amber-200/60 bg-amber-50/60 p-3 text-left">
              <p className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold mb-2">Top Attackers</p>
              <ol className="space-y-1.5">
                {top3.map((entry, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none">{MEDALS[i]}</span>
                      <span className="font-medium">{entry.nickname}</span>
                    </span>
                    <span className="font-semibold text-amber-800">{entry.damage} dmg</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-3/4 mx-auto block min-h-[38px] rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-semibold text-sm border border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] transition-all duration-150"
          >
            Conferma
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BossVictoryPopup;
