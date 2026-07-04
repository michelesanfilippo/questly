'use client';

import type { UserProfile, LeaderboardEntry } from '@/types';
import { getBadge } from '@/lib/badges';

interface LeaderboardProps {
  currentUser: UserProfile;
}

const MOCK_TOP: Omit<LeaderboardEntry, 'rank'>[] = [
  { nickname: 'ArcaneWarden',    level: 15, xp: 3200, badge: 'Mythic Builder'   },
  { nickname: 'ShadowCrafter',   level: 13, xp: 2700, badge: 'Mythic Builder'   },
  { nickname: 'LoreSeeker_X',    level: 12, xp: 2400, badge: 'Mythic Builder'   },
  { nickname: 'RuneForge',       level: 10, xp: 1950, badge: 'Mythic Builder'   },
  { nickname: 'VoidPaladin',     level: 9,  xp: 1500, badge: 'Arcane Engineer'  },
  { nickname: 'StormScribe',     level: 8,  xp: 1200, badge: 'Arcane Engineer'  },
  { nickname: 'PhantomQuill',    level: 7,  xp: 900,  badge: 'Arcane Engineer'  },
  { nickname: 'EmberSage',       level: 5,  xp: 700,  badge: 'Prompt Knight'    },
  { nickname: 'FrostOracle',     level: 4,  xp: 500,  badge: 'Prompt Knight'    },
  { nickname: 'DawnAcolyte',     level: 3,  xp: 300,  badge: 'Prompt Knight'    },
];

export function Leaderboard({ currentUser }: LeaderboardProps) {
  const userBadge = getBadge(currentUser);

  const userEntry: Omit<LeaderboardEntry, 'rank'> = {
    nickname: currentUser.nickname,
    level: currentUser.level,
    xp: currentUser.xp,
    badge: userBadge.name,
  };

  // Merge + sort by XP desc
  const allEntries = [...MOCK_TOP, userEntry].sort((a, b) => b.xp - a.xp);

  // Remove duplicates: if currentUser nickname matches a mock entry, prefer live data
  const seen = new Set<string>();
  const deduped = allEntries.filter((e) => {
    const key = e.nickname.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const ranked: LeaderboardEntry[] = deduped.map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-white font-bold text-lg">Leaderboard</h2>
      </div>

      <div className="divide-y divide-slate-700/40">
        {/* Header row */}
        <div className="hidden sm:grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 px-4 py-2 text-xs text-slate-500 uppercase tracking-wide">
          <span>#</span>
          <span>Adventurer</span>
          <span className="text-right">Badge</span>
          <span className="text-right">Lv</span>
          <span className="text-right">XP</span>
        </div>

        {ranked.map((entry) => {
          const isMe = entry.nickname.toLowerCase() === currentUser.nickname.toLowerCase();
          return (
            <div
              key={entry.nickname}
              className={[
                'grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-3 px-4 py-3 items-center transition-colors',
                isMe
                  ? 'ring-1 ring-inset ring-amber-500/50 bg-amber-500/5'
                  : 'hover:bg-slate-700/20',
              ].join(' ')}
            >
              {/* Rank */}
              <span
                className={[
                  'text-sm font-bold',
                  entry.rank === 1
                    ? 'text-amber-400'
                    : entry.rank === 2
                    ? 'text-slate-300'
                    : entry.rank === 3
                    ? 'text-amber-700'
                    : 'text-slate-500',
                ].join(' ')}
              >
                {entry.rank}
              </span>

              {/* Nickname */}
              <span className={`text-sm font-medium truncate ${isMe ? 'text-amber-300' : 'text-white'}`}>
                {entry.nickname}
                {isMe && <span className="ml-1 text-xs text-amber-500">(you)</span>}
              </span>

              {/* Level — visible on mobile too */}
              <span className="text-sm text-slate-300 text-right sm:hidden">
                Lv {entry.level}
              </span>

              {/* Badge — desktop only */}
              <span className="hidden sm:block text-xs text-slate-400 text-right whitespace-nowrap">
                {entry.badge}
              </span>

              {/* Level — desktop */}
              <span className="hidden sm:block text-sm text-slate-300 text-right">
                {entry.level}
              </span>

              {/* XP — desktop */}
              <span className="hidden sm:block text-sm text-amber-400 text-right font-mono">
                {entry.xp.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
