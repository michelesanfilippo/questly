import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { isBossWeekend } from '@/lib/boss';
import { supabase } from '@/lib/supabase';
import { BossSummonPopup } from './BossSummonPopup';
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
  const [selectedQuest, setSelectedQuest] = useState<BossMission | null>(null);
  const [showInlineQuest, setShowInlineQuest] = useState(false);
  const [questAnswer, setQuestAnswer] = useState('');
  const [attackResult, setAttackResult] = useState<any>(null);
  const [showAttackResult, setShowAttackResult] = useState(false);
  const [showSummonPopup, setShowSummonPopup] = useState(false);
  const [summonedBoss, setSummonedBoss] = useState<BossState | null>(null);
  const [hasUserAttacked, setHasUserAttacked] = useState(false);
  const [userLastScore, setUserLastScore] = useState(0);
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [damageDealt, setDamageDealt] = useState(0);

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

  // Fetch boss state AND check if user already attacked
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
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch boss state from API endpoint
      const response = await fetch(`/api/boss/state?guildId=${guildId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load boss state');
        onError?.(data.error);
        setIsLoading(false);
        return;
      }

      if (data.boss) {
        setBoss(data.boss);
      } else {
        // No boss exists yet, will be created on first attack
        setBoss(null);
      }

      // Check if user already attacked (query boss_attempts table)
      try {
        const { data: supabaseAuth } = await supabase.auth.getUser();
        if (supabaseAuth.user) {
          // Calculate week start
          const now = new Date();
          const utcNow = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
          const dayOfWeek = utcNow.getUTCDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekStart = new Date(utcNow);
          weekStart.setUTCDate(weekStart.getUTCDate() - daysToMonday);
          weekStart.setUTCHours(0, 0, 0, 0);
          const weekStartStr = weekStart.toISOString().split('T')[0];
          
          const { data: attempts } = await supabase
            .from('boss_attempts')
            .select('id')
            .eq('user_id', supabaseAuth.user.id)
            .eq('guild_id', guildId)
            .gte('created_at', weekStartStr)
            .limit(1);
          
          setHasUserAttacked(attempts !== null && attempts.length > 0);
        }
      } catch (err) {
        console.warn('[fetchBossState] Failed to check attack history:', err);
      }

      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load boss';
      setError(message);
      onError?.(message);
      setIsLoading(false);
    }
  }, [guildId, onError]);

  // Initial fetch on mount only
  useEffect(() => {
    fetchBossState();
  }, [fetchBossState]);

  // Polling: Fetch boss state every 4 seconds to keep global state updated
  useEffect(() => {
    if (!boss || boss.is_defeated) return; // Stop polling if no boss or defeated

    const pollInterval = setInterval(() => {
      fetchBossState();
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(pollInterval);
  }, [boss, fetchBossState]);

  // Handle attack button click - show inline quest
  const handleAttackClick = () => {
    if (hasUserAttacked) return;
    
    // Get random quest
    const bossKey = boss?.boss_key || 'goblin';
    const difficulty = boss?.boss_rarity || 1;
    const mission = getRandomMissionForBoss(bossKey, difficulty);
    
    if (mission) {
      setSelectedQuest(mission);
      setShowInlineQuest(true);
      setQuestAnswer(''); // Clear previous answer
    }
  };

  // Handle quest answer submission
  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      if (!answer.trim() || answer.trim().length < 10) {
        setError('Answer must be at least 10 characters');
        return;
      }

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
            userAnswer: answer,
            bossKey: boss?.boss_key || 'goblin',
            userRole,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Attack failed');
        }

        // Update state with results
        setAttackResult(data);
        setHasUserAttacked(true);
        setUserLastScore(data.attack.score);
        setDamageDealt(data.attack.damage_dealt);
        setUserFeedback(data.evaluation?.feedback || '');
        setUserSuggestions(data.evaluation?.suggestions || []);
        
        // Hide quest, show result
        setShowInlineQuest(false);
        setQuestAnswer('');
        setShowAttackResult(true);
        
        // Update boss state
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
          };
        });

        // Trigger victory if defeated
        if (data.boss_state.is_defeated) {
          onVictory?.();
        }

        // Refresh state
        await fetchBossState();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Attack failed';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [guildId, userRole, onVictory, fetchBossState, boss?.boss_key]
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
        {boss && isBossWeekendFlag ? (
          <div className="rounded-lg border-2 border-amber-700 bg-gray-900 p-6">
            {/* Boss Name + Rarity */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-amber-800">
                  {boss?.boss_key?.toUpperCase() || 'MYSTERIOUS BEAST'}
                </h3>
                <p className="text-amber-700 text-sm font-semibold">
                  {rarityEmoji[boss?.boss_rarity || 0] || ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-amber-800">
                  {boss?.current_hp || 0} / {boss?.max_hp || 0} HP
                </p>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mb-4 h-6 overflow-hidden rounded-full border-2 border-gray-700 bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500"
                style={{
                  width: `${Math.max(0, ((boss?.current_hp || 0) / (boss?.max_hp || 1)) * 100)}%`,
                }}
              />
            </div>

            {/* INLINE QUEST - Like Daily Quest Card (Parchment Style) */}
            {showInlineQuest && selectedQuest && !showAttackResult ? (
              <div className="mb-4 space-y-3 rounded-sm bg-[#faf7f0] p-4">
                <h3 className="text-lg font-bold text-stone-800">{selectedQuest.title}</h3>
                <p className="whitespace-pre-wrap text-sm text-stone-700 leading-relaxed">
                  {selectedQuest.text}
                </p>
                <textarea
                  value={questAnswer}
                  onChange={(e) => setQuestAnswer(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Scrivi la tua risposta..."
                  rows={3}
                  className="w-full rounded-sm border-2 bg-[#faf7f0] text-stone-800 placeholder-stone-400 border-amber-300/60 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all duration-200 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSubmitAnswer(questAnswer)}
                  disabled={isSubmitting || !questAnswer.trim()}
                  className="w-full rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-semibold text-sm border border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] transition-all duration-150 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Submit & Attack'}
                </button>
              </div>
            ) : null}

            {/* RECAP - After Submit (Parchment Style) */}
            {showAttackResult && attackResult ? (
              <div className="mb-4 rounded-sm bg-[#faf7f0] border-2 border-amber-300/60 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-800 font-semibold">Danno Inflitto:</span>
                    <span className="font-bold text-amber-700">+{damageDealt}</span>
                  </div>
                  {userSuggestions && userSuggestions.length > 0 && (
                    <div className="border-t border-amber-300/60 pt-2">
                      <p className="text-xs text-stone-800 font-semibold mb-1">Suggerimenti:</p>
                      <ul className="space-y-1 text-xs text-stone-700">
                        {userSuggestions.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Attack Button - Only visible if NOT showing quest or result */}
            {boss && !boss.is_defeated && !showInlineQuest && !showAttackResult && (
              <button
                onClick={handleAttackClick}
                disabled={isSubmitting || hasUserAttacked}
                className="w-full rounded-lg border-2 border-amber-600 bg-amber-700 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                {hasUserAttacked ? 'Already Attacked' : isSubmitting ? 'Attacking...' : 'Attack Boss'}
              </button>
            )}

            {/* Defeated Badge */}
            {boss?.is_defeated && (
              <div className="rounded-lg border-2 border-yellow-700 bg-yellow-900/30 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-300">DEFEATED</p>
                {attackResult?.rewards && (
                  <div className="mt-2 text-sm text-yellow-200">
                    <p>Guild XP: +{attackResult.rewards.guild_xp}</p>
                    <p>Your XP: +{attackResult.rewards.user_xp}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isBossWeekendFlag ? (
          /* No Boss Yet - Weekend Active */
          <div className="rounded-lg border-2 border-amber-700 bg-gray-900 p-6 text-center">
            <p className="mb-3 text-lg font-bold text-amber-800">Nessun Boss Attivo</p>
            <p className="mb-4 text-sm text-amber-700">
              Sii il primo ad attaccare e invoca il boss!
            </p>
            {!showAttackResult && (
              <button
                onClick={handleAttackClick}
                disabled={isSubmitting || hasUserAttacked}
                className="rounded-lg border-2 border-amber-600 bg-amber-700 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                {hasUserAttacked ? 'Already Attacked' : isSubmitting ? 'Summoning...' : 'Summon Boss'}
              </button>
            )}
          </div>
        ) : (
          /* Not Weekend */
          <div className="rounded-lg border-2 border-amber-700 bg-gray-900 p-6 text-center">
            <p className="mb-3 text-lg font-bold text-amber-800">Boss Weekend Closed</p>
            <p className="text-sm text-amber-700">
              Boss battles available only on weekends (Saturday & Sunday UTC)
            </p>
          </div>
        )}
      </div>

      {/* Quest Modal - REMOVED (now inline on card) */}

      {/* Boss Summon Popup */}
      {showSummonPopup && summonedBoss && (
        <BossSummonPopup
          bossName={summonedBoss.boss_key}
          bossRarity={summonedBoss.boss_rarity}
          onClose={() => setShowSummonPopup(false)}
        />
      )}

      {/* Attack Result Modal */}
      {/* Report is shown on the card above - no modal needed */}
    </>
  );
};

export default BossPanel;
