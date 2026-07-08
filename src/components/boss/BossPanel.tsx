import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { isBossWeekend } from '@/lib/boss';
import { supabase } from '@/lib/supabase';
import { BossQuestModal } from './BossQuestModal';
import bossMissionsData from '@/data/boss_missions.json';

interface BossState {
  boss_key: string;
  boss_rarity: number;
  max_hp: number;
  current_hp: number;
  total_damage: number;
  is_defeated: boolean;
  attempted_count?: number;
}

interface BossMission {
  id: string;
  title: string;
  text: string;
}

interface BossPanelProps {
  guildId: string;
  userRole?: 'leader' | 'royal_knight' | 'wizard' | 'member';
  onVictory?: () => void;
  onError?: (error: string) => void;
}

export const BossPanel: React.FC<BossPanelProps> = ({
  guildId,
  userRole = 'member',
  onVictory,
  onError,
}) => {
  const { t } = useI18n();

  const [boss, setBoss] = useState<BossState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBossWeekendFlag, setIsBossWeekendFlag] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<BossMission | null>(null);
  const [attackResult, setAttackResult] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Get Supabase auth token
  const getAuthToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // Get random mission for this boss
  const getRandomMissionForBoss = (bossKey: string, difficulty: number): BossMission | null => {
    try {
      const missions = (bossMissionsData.boss_missions as any)[bossKey]?.[difficulty];
      if (Array.isArray(missions) && missions.length > 0) {
        return missions[Math.floor(Math.random() * missions.length)];
      }
    } catch {
      console.error('Failed to get mission for boss:', bossKey);
    }
    return null;
  };

  // Fetch boss state (with debounce to prevent constant requests)
  const fetchBossState = useCallback(async () => {
    try {
      setError(null);

      // Check if boss weekend (local calendar) OR force_weekend_testing flag
      const isCalendarWeekend = isBossWeekend();
      
      let forceWeekend = false;
      try {
        const configResponse = await fetch('/api/boss/config');
        const configData = await configResponse.json();
        forceWeekend = configData.force_weekend_testing === true;
      } catch {
        // If config fetch fails, just use calendar check
      }
      
      const isWeekend = isCalendarWeekend || forceWeekend;
      setIsBossWeekendFlag(isWeekend);

      if (!isWeekend) {
        setBoss(null);
        setIsLoading(false);
        return;
      }

      // Get auth token
      const token = await getAuthToken();

      // Fetch boss state from API endpoint
      const response = await fetch(`/api/boss/state?guildId=${guildId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
        },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load boss state');
        onError?.(data.error);
        return;
      }

      if (data.boss) {
        setBoss(data.boss);
      } else {
        // No boss exists yet, will be created on first attack
        setBoss(null);
      }

      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load boss';
      setError(message);
      onError?.(message);
      setIsLoading(false);
    }
  }, [guildId, onError]);

  // Initial fetch on mount
  useEffect(() => {
    fetchBossState();
  }, [fetchBossState]);

  // Poll for updates (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Only fetch if last fetch was more than 2 seconds ago
      if (now - lastFetchTime > 2000) {
        setLastFetchTime(now);
        fetchBossState();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchBossState, lastFetchTime]);

  // Handle attack button click - open quest modal
  const handleAttackClick = () => {
    if (!boss && !selectedQuest) {
      // First attack - select random quest from goblin (default)
      const bossKey = boss?.boss_key ?? 'goblin';
      const difficulty = boss?.boss_rarity ?? 1;
      const mission = getRandomMissionForBoss(bossKey, difficulty);
      if (mission) {
        setSelectedQuest(mission);
      }
    } else if (selectedQuest) {
      setShowQuestModal(true);
    } else {
      // Select random quest for existing boss
      const mission = getRandomMissionForBoss(boss!.boss_key, boss!.boss_rarity);
      if (mission) {
        setSelectedQuest(mission);
        setShowQuestModal(true);
      }
    }
  };

  // Handle quest answer submission
  const handleQuestAnswerSubmit = useCallback(
    async (answer: string, score: number) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call attack endpoint
        const response = await fetch('/api/boss/attack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            guildId,
            missionScore: score,
            userRole,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Attack failed');
        }

        // Update boss state
        setAttackResult(data);
        setBoss((prev) => {
          if (!prev && data.boss_state) {
            return data.boss_state;
          }
          if (!prev) return null;
          return {
            ...prev,
            current_hp: data.boss_state.current_hp,
            total_damage: data.boss_state.total_damage,
            is_defeated: data.boss_state.is_defeated,
            attempted_count: (prev.attempted_count || 0) + 1,
          };
        });

        // Clear selected quest
        setSelectedQuest(null);
        setShowQuestModal(false);

        // Trigger victory callback if defeated
        if (data.boss_state.is_defeated) {
          onVictory?.();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Attack failed';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [guildId, userRole, onVictory]
  );

  // If not weekend, show message
  if (!isBossWeekendFlag && !isLoading) {
    return (
      <div className="rounded-lg border border-amber-700 bg-amber-950/40 p-6 text-center">
        <p className="mb-2 text-amber-300">🌙 Boss Weekends: Saturday-Sunday UTC</p>
        <p className="text-sm text-amber-400/70">Check back this weekend!</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-600 bg-gray-900/40 p-6 text-center">
        <p className="text-gray-400">Loading boss data...</p>
      </div>
    );
  }

  // Error state
  if (error && !boss) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-900/40 p-6">
        <p className="text-red-300">Error: {error}</p>
      </div>
    );
  }

  const rarityEmoji = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

  return (
    <>
      <div className="space-y-4">
        {/* Error Alert (non-fatal) */}
        {error && (
          <div className="rounded-lg border border-red-700 bg-red-900/30 p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Boss Card - Simplified */}
        {boss ? (
          <div className="rounded-lg border-2 border-amber-700/50 bg-gradient-to-br from-amber-950 to-amber-900/50 p-6">
            {/* Boss Name + Rarity */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-amber-100">
                  🐉 {boss.boss_key.toUpperCase()}
                </h3>
                <p className="text-amber-400 text-sm">
                  {rarityEmoji[boss.boss_rarity] || '⭐'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-amber-100">
                  {boss.current_hp} / {boss.max_hp} HP
                </p>
                <p className="text-xs text-amber-400">
                  Damage: {boss.total_damage}
                </p>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mb-4 h-6 overflow-hidden rounded-full border border-amber-700 bg-amber-950">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                style={{
                  width: `${Math.max(0, (boss.current_hp / boss.max_hp) * 100)}%`,
                }}
              />
            </div>

            {/* Attack Result */}
            {attackResult && !attackResult.boss_state.is_defeated && (
              <div className="mb-4 rounded-lg bg-green-900/30 p-3 text-green-300 text-sm">
                ⚔️ Hit for <span className="font-bold">{attackResult.attack.damage_dealt}</span> damage!
              </div>
            )}

            {/* Attack Button */}
            {!boss.is_defeated && (
              <button
                onClick={handleAttackClick}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-amber-600 bg-amber-700 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Attacking...' : 'Submit & Attack'}
              </button>
            )}

            {/* Defeated Badge */}
            {boss.is_defeated && (
              <div className="rounded-lg bg-yellow-900/30 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-300">✨ DEFEATED ✨</p>
                {attackResult?.rewards && (
                  <div className="mt-2 text-sm text-yellow-200">
                    <p>Guild XP: +{attackResult.rewards.guild_xp}</p>
                    <p>Your XP: +{attackResult.rewards.user_xp}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* No Boss Yet */
          <div className="rounded-lg border-2 border-amber-700/50 bg-gradient-to-br from-amber-950 to-amber-900/50 p-6 text-center">
            <p className="mb-3 text-lg font-bold text-amber-100">🐉 No Active Boss</p>
            <p className="mb-4 text-sm text-amber-300">
              Be the first to attack and summon a boss!
            </p>
            <button
              onClick={handleAttackClick}
              disabled={isSubmitting}
              className="rounded-lg border border-amber-600 bg-amber-700 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Summoning...' : 'Submit & Attack'}
            </button>
          </div>
        )}
      </div>

      {/* Quest Modal */}
      {showQuestModal && selectedQuest && boss && (
        <BossQuestModal
          quest={selectedQuest}
          bossName={boss.boss_key}
          onSubmit={handleQuestAnswerSubmit}
          onClose={() => setShowQuestModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
};

export default BossPanel;
