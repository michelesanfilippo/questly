'use client';

import { motion } from 'framer-motion';
import { signOut } from '@/lib/supabaseAuth';
import { BadgeGrid } from '@/components/ui/BadgeGrid';
import { xpForLevel } from '@/lib/badges';
import type { SupabaseProfile } from '@/types';

interface UserCardProps {
  profile: SupabaseProfile;
  earnedBadges: number[];
  onSignOut?: () => void;
}

export function UserCard({ profile, earnedBadges, onSignOut }: UserCardProps) {
  const xpNeeded = xpForLevel(profile.level);
  const xpCurrent = profile.xp % xpNeeded;
  const xpPercent = (xpCurrent / xpNeeded) * 100;
  const initials = profile.nickname.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    onSignOut?.();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-[#faf7f0] dark:bg-slate-900/95 border-2 border-amber-800/30 dark:border-indigo-500/30 rounded-sm shadow-[2px_4px_12px_rgba(101,67,33,0.2)] p-5"
    >
      {/* Corner decorations */}
      <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
      <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />
      <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
      <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />

      {/* Avatar + name row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-amber-700 dark:bg-indigo-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-serif font-bold text-amber-900 dark:text-indigo-100 truncate">
            {profile.nickname}
          </span>
          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-indigo-900/60 text-amber-800 dark:text-indigo-200 w-fit mt-0.5">
            Lv. {profile.level}
          </span>
        </div>
      </div>

      {/* XP bar */}
      <div className="h-2 w-full bg-amber-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 dark:from-indigo-400 dark:to-indigo-600 transition-all duration-500"
          style={{ width: `${xpPercent}%` }}
        />
      </div>
      <p className="text-xs text-stone-500 dark:text-indigo-300/70 mb-1">
        {xpCurrent} / {xpNeeded} XP
      </p>
      <p className="text-xs text-stone-500 dark:text-indigo-300/70">
        {profile.missions_completed} quests completed
      </p>

      {/* Divider */}
      <div className="border-t border-amber-800/10 dark:border-indigo-500/20 my-3" />

      {/* Badges */}
      <BadgeGrid size="sm" earnedIndexes={earnedBadges} />

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="mt-3 text-xs text-stone-400 dark:text-indigo-400/50 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors"
      >
        Sign out
      </button>
    </motion.div>
  );
}

