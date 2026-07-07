'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getBadgeImagePath, BADGE_DEFINITIONS } from '@/lib/badges';
import { useI18n } from '@/i18n';

interface SupabaseProfile {
  id: string;
  nickname: string;
  email: string | null;
  level: number;
  xp: number;
  missions_completed: number;
  created_at: string;
  profile_badge_index?: number | null;
}

interface ProfileWithBadgeCount extends SupabaseProfile {
  badge_count: number;
}

type Tab = 'Level' | 'Badges' | 'Missions';

interface LeaderboardProps {
  currentUserId?: string;
  isLoggedIn?: boolean;
}

export function Leaderboard({ currentUserId, isLoggedIn = false }: LeaderboardProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('Level');
  const [entries, setEntries] = useState<ProfileWithBadgeCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchEntries() {
      setLoading(true);

      try {
        if (activeTab === 'Level') {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('level', { ascending: false })
            .order('xp', { ascending: false })
            .limit(20);

          if (error || !data || cancelled) return;

          setEntries(
            data.map((p: SupabaseProfile) => ({ ...p, badge_count: 0 }))
          );
        } else if (activeTab === 'Badges') {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, nickname, level, xp, missions_completed, created_at, email, profile_badge_index, user_badges(count)')
            .limit(50);

          if (error || !data || cancelled) return;

          const mapped: ProfileWithBadgeCount[] = (data as Array<SupabaseProfile & { user_badges: { count: number }[] }>)
            .map((p) => ({
              ...p,
              badge_count: p.user_badges?.[0]?.count ?? 0,
            }))
            .sort((a, b) => b.badge_count - a.badge_count)
            .slice(0, 20);

          setEntries(mapped);
        } else {
          // Missions
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('missions_completed', { ascending: false })
            .limit(20);

          if (error || !data || cancelled) return;

          setEntries(
            data.map((p: SupabaseProfile) => ({ ...p, badge_count: 0 }))
          );
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEntries();
    return () => { cancelled = true; };
  }, [activeTab]);

  const tabs: Tab[] = ['Level', 'Badges', 'Missions'];

  function getMetric(entry: ProfileWithBadgeCount): string {
    if (activeTab === 'Level') return `Lv.${entry.level}`;
    if (activeTab === 'Badges') return `${entry.badge_count} badges`;
    return `${entry.missions_completed} quests`;
  }

  function rankColor(rank: number): string {
    if (rank === 1) return 'text-amber-500';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-amber-700';
    return 'text-stone-400';
  }

  return (
    <div className="relative bg-[#faf7f0] border-2 border-amber-800/30 rounded-sm shadow-[2px_4px_12px_rgba(101,67,33,0.2)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-800/10">
        <h3 className="font-serif font-bold text-amber-900">
          {t('leaderboard.title')}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'text-xs px-3 py-1 rounded-sm transition-colors font-medium',
              activeTab === tab
                ? 'bg-amber-100 text-amber-800'
                : 'text-stone-500 hover:text-amber-700',
            ].join(' ')}
          >
            {t(`leaderboard.${tab.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pb-2">
        {loading ? (
          // Skeleton
          <div className="flex flex-col gap-2 px-4 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 bg-amber-100/50 animate-pulse rounded"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {entries.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-6">
                  {t('leaderboard.no_data')}
                </p>
              ) : (
                entries.map((entry, index) => {
                  const rank = index + 1;
                  const isMe = !!currentUserId && entry.id === currentUserId;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={[
                        'flex items-center gap-3 px-4 py-2.5',
                        isMe
                          ? 'bg-amber-100/50 font-semibold'
                          : '',
                      ].join(' ')}
                    >
                      {/* Rank */}
                      <span className={`text-sm font-bold w-5 shrink-0 ${rankColor(rank)}`}>
                        {rank}
                      </span>

                      {/* Profile badge/avatar — hover to enlarge */}
                      <div className="relative group w-7 h-7 rounded-full shrink-0 overflow-visible">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          {entry.profile_badge_index != null ? (
                            <Image
                              src={getBadgeImagePath(entry.profile_badge_index)}
                              alt=""
                              width={28}
                              height={28}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                              {entry.nickname.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Hover enlarged badge */}
                        {entry.profile_badge_index != null && (
                         <div className={`absolute left-1/2 -translate-x-1/2 z-30 hidden group-hover:flex flex-col items-center pointer-events-none ${index < 2 ? 'top-9' : 'bottom-9'}`}>
                            <Image
                              src={getBadgeImagePath(entry.profile_badge_index)}
                              alt=""
                              width={120}
                              height={120}
                              className="rounded-full shadow-[0_0_16px_rgba(217,119,6,0.5)] border-2 border-amber-300/60"
                            />
                            <div className="mt-1 px-2 py-0.5 bg-[#faf7f0] border border-amber-300/40 rounded text-xs text-amber-900 font-medium whitespace-nowrap shadow">
                              {(() => { const def = BADGE_DEFINITIONS.find(b => b.index === entry.profile_badge_index); return def?.name ?? 'Badge'; })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nickname */}
                      <span className="text-sm font-medium text-amber-900 truncate flex-1">
                        {entry.nickname}
                        {isMe && (
                          <span className="ml-1 text-xs text-amber-600">
                            {t('leaderboard.you')}
                          </span>
                        )}
                      </span>

                      {/* Metric */}
                      <span className="text-xs text-stone-500 shrink-0">
                        {getMetric(entry)}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Lock veil for non-logged users */}
      {!isLoggedIn && (
        <div className="absolute inset-0 backdrop-blur-[3px] bg-[#faf7f0]/60 flex flex-col items-center justify-center gap-3 rounded-sm">
          <span className="text-4xl select-none">🔒</span>
          <p className="text-base font-serif font-bold text-amber-900 text-center px-4 leading-snug">
            {t('leaderboard.leaderboard_lock')}
          </p>
        </div>
      )}
    </div>
  );
}

