import React, { useCallback, useEffect, useState } from 'react';
import { BossCard } from './BossCard';
import { BossMissionInput } from './BossMissionInput';
import { useI18n } from '@/i18n';
import { getWeekBoss, isBossWeekend } from '@/lib/boss';
import { supabase } from '@/lib/supabase';

interface BossMission {
  id: string;
  title: string;
  description: string;
  difficulty: number;
}

interface BossState {
  boss_key: string;
  boss_rarity: number;
  max_hp: number;
  current_hp: number;
  total_damage: number;
  is_defeated: boolean;
  attempted_count?: number;
}

interface BossPanelProps {
  guildId: string;
  userRole?: 'leader' | 'royal_knight' | 'wizard' | 'member';
  onVictory?: () => void;
  onError?: (error: string) => void;
}

/**
 * BossPanel
 *
 * Main container for boss weekend system:
 * 1. Fetches current boss state from database
 * 2. Displays BossCard with HP bar + stats
 * 3. Displays BossMissionInput for mission selection
 * 4. Handles attack submission via POST /api/boss/attack
 * 5. Shows attack result + updates boss state
 * 6. Triggers victory popup if boss defeated
 *
 * Only visible on weekends (Sat/Sun UTC)
 */
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
  const [attackResult, setAttackResult] = useState<any>(null);
  const [isBossWeekendFlag, setIsBossWeekendFlag] = useState(false);

  // Get Supabase auth token
  const getAuthToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // Check if weekend + fetch initial boss state
  useEffect(() => {
    const checkWeekendAndFetchBoss = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if boss weekend (local calendar) OR force_weekend_testing flag
        const isCalendarWeekend = isBossWeekend();
        
        // Fetch force_weekend_testing flag from config
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load boss';
        setError(message);
        onError?.(message);
      } finally {
        setIsLoading(false);
      }
    };

    checkWeekendAndFetchBoss();

    // Poll boss state every 3 seconds (faster than before for real-time feel)
    const interval = setInterval(checkWeekendAndFetchBoss, 3000);
    return () => clearInterval(interval);
  }, [guildId, onError]);

  // Handle mission selection + attack submission
  const handleMissionSelect = useCallback(
    async (mission: BossMission, score: number) => {
      setIsSubmitting(true);
      setError(null);
      setAttackResult(null);

      try {
        // Get auth token
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
          if (!prev) return null;
          return {
            ...prev,
            current_hp: data.boss_state.current_hp,
            total_damage: data.boss_state.total_damage,
            is_defeated: data.boss_state.is_defeated,
            attempted_count: (prev.attempted_count || 0) + 1,
          };
        });

        // Trigger victory callback if defeated
        if (data.boss_state.is_defeated) {
          onVictory?.();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Attack failed';
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [guildId, userRole, onVictory]
  );

  // If not weekend, show message
  if (!isBossWeekendFlag) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400 mb-2">🌙 Boss Weekends are Saturday-Sunday UTC</p>
        <p className="text-gray-500 text-sm">Check back this weekend!</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">Loading boss data...</p>
      </div>
    );
  }

  // Error state
  if (error && !boss) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-6">
        <p className="text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert (non-fatal) */}
      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Boss Card or Placeholder */}
      {boss ? (
        <BossCard
          guildId={guildId}
          boss={boss}
          isLoading={isSubmitting}
          isBossWeekend={isBossWeekendFlag}
          currentUserRole={userRole}
          onAttackClick={() => {
            // This is just a placeholder; actual attack happens in BossMissionInput
          }}
        />
      ) : (
        <div className="rounded-sm border-2 border-amber-800/30 bg-amber-50/50 p-4 text-center">
          <p className="text-amber-900 font-semibold mb-2">🐉 No Active Boss This Week</p>
          <p className="text-sm text-amber-800">
            Be the first to attack and summon a boss!
          </p>
        </div>
      )}

      {/* Attack Result Display */}
      {attackResult && !attackResult.boss_state.is_defeated && (
        <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
          <p className="text-green-200 font-bold">
            ⚔️ Hit for {attackResult.attack.damage_dealt} damage!
          </p>
          <p className="text-green-300 text-sm">
            Boss HP: {attackResult.boss_state.current_hp} / {attackResult.boss_state.max_hp}
          </p>
        </div>
      )}

      {/* Victory Display */}
      {boss?.is_defeated && (
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 border-2 border-yellow-400">
          <p className="text-white font-bold text-2xl mb-2">🎉 Victory!</p>
          <p className="text-yellow-100 mb-3">
            Your guild defeated {boss.boss_key.toUpperCase()}!
          </p>
          {attackResult?.rewards && (
            <div className="bg-black bg-opacity-30 rounded p-3 text-yellow-200 text-sm">
              <p>Guild XP: +{attackResult.rewards.guild_xp}</p>
              <p>Your XP: +{attackResult.rewards.user_xp}</p>
            </div>
          )}
        </div>
      )}

      {/* Mission Input (only if not defeated) */}
      {(!boss || !boss.is_defeated) && isBossWeekendFlag && (
        <BossMissionInput
          bossKey={boss?.boss_key ?? 'goblin'}
          guildId={guildId}
          onMissionSelect={handleMissionSelect}
          isLoading={isSubmitting}
          currentUserRole={userRole}
        />
      )}

      {/* Call to Action */}
      {(!boss || !boss.is_defeated) && isBossWeekendFlag && (
        <p className="text-center text-gray-400 text-sm">
          {boss ? 'Select a mission and complete it to attack the boss!' : 'Be the first to attack the boss!'}
        </p>
      )}
    </div>
  );
};

export default BossPanel;
