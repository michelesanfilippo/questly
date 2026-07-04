'use client';

import { motion } from 'framer-motion';

interface XPBarProps {
  xp: number;
  level: number;
}

function totalXpForLevel(level: number): number {
  // Sum of i*100 for i = 1 to level-1
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += i * 100;
  }
  return total;
}

export function XPBar({ xp, level }: XPBarProps) {
  const baseXp = totalXpForLevel(level);
  const levelXp = level * 100;
  const xpInLevel = xp - baseXp;
  const progress = Math.min(1, Math.max(0, xpInLevel / levelXp));
  const percent = Math.round(progress * 100);

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-400">Lv {level}</span>
        <span className="text-xs text-slate-400">
          {xpInLevel} / {levelXp} XP
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
