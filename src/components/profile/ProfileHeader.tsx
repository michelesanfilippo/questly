'use client';

import type { UserProfile } from '@/types';
import { getBadge } from '@/lib/badges';
import { XPBar } from '@/components/ui/XPBar';
import { BadgeDisplay } from '@/components/ui/BadgeDisplay';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const badge = getBadge(profile);

  return (
    <div className="flex flex-row items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      {/* Avatar */}
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm select-none">
        {profile.avatar}
      </div>

      {/* Badge + XP */}
      <div className="flex-1 min-w-0 space-y-1">
        <BadgeDisplay badge={badge} nickname={profile.nickname} />
        <XPBar xp={profile.xp} level={profile.level} />
      </div>

      {/* Streak */}
      <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
        <span className="text-orange-400 text-xl leading-none">&#x1F525;</span>
        <span className="text-white font-bold text-sm leading-none">{profile.streak}</span>
        <span className="text-slate-400 text-xs leading-none">day</span>
      </div>
    </div>
  );
}
