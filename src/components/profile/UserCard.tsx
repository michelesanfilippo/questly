'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { xpForLevel, BADGE_DEFINITIONS, getBadgeImagePath } from '@/lib/badges';
import { setProfileBadge } from '@/lib/supabaseAuth';
import { BadgeDetailPopup } from '@/components/ui/BadgeDetailPopup';
import type { SupabaseProfile } from '@/types';

interface UserCardProps {
  profile: SupabaseProfile;
  earnedBadges: number[];
  onProfileUpdate?: (updated: SupabaseProfile) => void;
}

export function UserCard({ profile, earnedBadges, onProfileUpdate }: UserCardProps) {
  const xpNeeded = xpForLevel(profile.level);
  const xpCurrent = profile.xp % xpNeeded;
  const xpPercent = (xpCurrent / xpNeeded) * 100;
  const initials = profile.nickname.slice(0, 2).toUpperCase();
  const [selectedBadge, setSelectedBadge] = useState<number | null>(null);

  async function handleSetAsProfile(badgeIndex: number) {
    await setProfileBadge(profile.id, badgeIndex);
    onProfileUpdate?.({ ...profile, profile_badge_index: badgeIndex });
  }

  const profileBadgeIndex = profile.profile_badge_index;

  return (
    <>
      {selectedBadge !== null && (() => {
        const def = BADGE_DEFINITIONS.find(b => b.index === selectedBadge);
        return def ? (
          <BadgeDetailPopup
            badgeName={def.name}
            badgeDescription={def.description}
            badgeImagePath={getBadgeImagePath(selectedBadge)}
            isProfileBadge={profileBadgeIndex === selectedBadge}
            onSetAsProfile={() => handleSetAsProfile(selectedBadge)}
            onClose={() => setSelectedBadge(null)}
          />
        ) : null;
      })()}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-[#faf7f0] dark:bg-slate-900/95 border-2 border-amber-800/30 dark:border-indigo-500/30 rounded-sm shadow-[2px_4px_12px_rgba(101,67,33,0.2)] p-5"
      >
        <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
        <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />
        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />

        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden">
            {profileBadgeIndex !== null && profileBadgeIndex !== undefined ? (
              <Image
                src={getBadgeImagePath(profileBadgeIndex)}
                alt="Profile badge"
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-full shadow-[0_0_8px_rgba(217,119,6,0.4)]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-amber-700 dark:bg-indigo-700 flex items-center justify-center text-white font-bold text-lg">
                {initials}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif font-bold text-amber-900 dark:text-indigo-100 truncate">{profile.nickname}</span>
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
        <p className="text-xs text-stone-500 dark:text-indigo-300/70 mb-1">{xpCurrent} / {xpNeeded} XP</p>
        <p className="text-xs text-stone-500 dark:text-indigo-300/70">{profile.missions_completed} quests completed</p>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <>
            <div className="border-t border-amber-800/10 dark:border-indigo-500/20 my-3" />
            <p className="text-xs uppercase tracking-widest text-stone-400 dark:text-indigo-400/50 mb-2 font-semibold">Badges</p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((idx) => {
                const def = BADGE_DEFINITIONS.find(b => b.index === idx);
                return (
                  <button
                    key={idx}
                    title={def?.name ?? `Badge ${idx}`}
                    onClick={() => setSelectedBadge(idx)}
                    className="rounded-full hover:scale-110 transition-transform duration-150 focus:outline-none"
                  >
                    <Image
                      src={getBadgeImagePath(idx)}
                      alt={def?.name ?? `Badge ${idx}`}
                      width={40}
                      height={40}
                      className={`rounded-full ${profileBadgeIndex === idx ? 'ring-2 ring-amber-500' : 'shadow-[0_0_8px_rgba(217,119,6,0.35)]'}`}
                    />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
