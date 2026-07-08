import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';
import { isBossWeekend } from '@/lib/boss';
import { supabase } from '@/lib/supabase';
import { StarRating } from '@/components/ui/StarRating';
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

  // Loading
  if (isLoading) {
    return (
      <div className="w-full rounded-sm border-2 border-amber-800/20 bg-[#faf7f0] p-6 space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-amber-200/50 rounded" />
        <div className="h-3 w-full bg-amber-200/50 rounded-full" />
        <div className="h-6 w-3/4 bg-amber-200/50 rounded" />
        <div className="h-16 w-full bg-amber-200/50 rounded" />
      </div>
    );
  }

  // Not weekend
  if (!isBossWeekendFlag) {
    return (
      <div className="w-full rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-5 sm:p-6 shadow-[2px_4px_12px_rgba(101,67,33,0.15)] text-center space-y-2">
        <p className="text-stone-700 font-semibold text-sm">Boss Weekend</p>
        <p className="text-xs text-stone-500">I boss appaiono ogni sabato e domenica (UTC). Torna presto!</p>
      </div>
    );
  }

  const bossName = boss?.boss_key
    ? boss.boss_key.charAt(0).toUpperCase() + boss.boss_key.slice(1)
    : 'Mysterious Beast';
  const bossRarity = boss?.boss_rarity ?? 1;
  const currentHp = boss?.current_hp ?? 0;
  const maxHp = boss?.max_hp ?? 100;
  const hpPct = Math.max(0, (currentHp / maxHp) * 100);
  const hpColor = hpPct > 50 ? 'from-emerald-600 to-emerald-400' : hpPct > 25 ? 'from-amber-600 to-amber-400' : 'from-red-700 to-red-500';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-5 sm:p-6 shadow-[2px_4px_12px_rgba(101,67,33,0.15)] space-y-4 relative"
      >
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-700/40 rounded-tl-sm" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-700/40 rounded-br-sm" />

        {/* Header: Boss Name + HP bar | Stars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-bold text-amber-900 font-serif truncate">{bossName}</span>
              {boss && (
                <span className="text-xs text-stone-500 shrink-0">
                  {currentHp} / {maxHp} HP
                </span>
              )}
            </div>
            <StarRating value={bossRarity} max={5} />
          </div>
          {/* HP Bar */}
          {boss && (
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 border border-amber-200">
              <div
                className={`h-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Non-fatal error */}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        {/* DEFEATED */}
        {boss?.is_defeated ? (
          <div className="rounded-sm bg-amber-50/80 border border-amber-200/60 p-4 text-center space-y-1">
            <p className="text-lg font-bold text-amber-900 font-serif">Boss Sconfitto!</p>
            <p className="text-xs text-stone-600">La tua gilda ha trionfato questa settimana.</p>
          </div>
        ) : showAttackResult && attackResult ? (
          /* RECAP after submission */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="rounded-sm bg-amber-50/80 border border-amber-200/60 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-700 font-semibold">Danno Inflitto</span>
                  <span className="font-bold text-amber-800">+{damageDealt}</span>
                </div>
                {userSuggestions.length > 0 && (
                  <div className="border-t border-amber-200/60 pt-2 space-y-1">
                    <p className="text-xs font-semibold text-stone-700">Suggerimenti:</p>
                    <ul className="space-y-1">
                      {userSuggestions.map((s, i) => (
                        <li key={i} className="text-xs text-stone-600">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-amber-800/60 italic">Hai già attaccato il boss questa settimana.</p>
            </motion.div>
          </AnimatePresence>
        ) : showInlineQuest && selectedQuest ? (
          /* INLINE QUEST */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h2 className="text-lg sm:text-xl font-bold text-amber-900 leading-snug font-serif">
                {selectedQuest.title}
              </h2>
              <div className="rounded-sm bg-amber-50/80 border border-amber-200/60 p-3 sm:p-4">
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {selectedQuest.text}
                </p>
              </div>
              <textarea
                value={questAnswer}
                onChange={(e) => setQuestAnswer(e.target.value)}
                disabled={isSubmitting}
                placeholder="Scrivi la tua risposta, avventuriero..."
                rows={5}
                className="w-full min-h-[120px] rounded-sm border-2 bg-[#faf7f0] text-stone-800 placeholder-stone-400 border-amber-300/60 p-3 sm:p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all duration-200 disabled:opacity-50"
              />
              <button
                onClick={() => handleSubmitAnswer(questAnswer)}
                disabled={isSubmitting || questAnswer.trim().length < 10}
                className="block w-3/4 mx-auto min-h-[38px] rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-semibold text-xs sm:text-sm border border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-4 h-4 border-2 border-amber-200/30 border-t-amber-100 rounded-full"
                    />
                    Attacco in corso...
                  </span>
                ) : 'Attacca il Boss'}
              </button>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* INITIAL STATE - Attack / Summon button */
          <div className="space-y-3">
            {!boss ? (
              <p className="text-sm text-stone-600 italic text-center">
                Sii il primo della tua gilda ad invocare il boss del weekend!
              </p>
            ) : (
              <p className="text-sm text-stone-600 italic text-center">
                {hasUserAttacked
                  ? 'Hai già attaccato il boss questa settimana.'
                  : 'Il boss ti sfida. Mostra il tuo valore!'}
              </p>
            )}
            {!hasUserAttacked && (
              <button
                onClick={handleAttackClick}
                disabled={isSubmitting}
                className="block w-3/4 mx-auto min-h-[38px] rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-semibold text-xs sm:text-sm border border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {boss ? 'Attacca il Boss' : 'Invoca il Boss'}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Boss Summon Popup */}
      {showSummonPopup && summonedBoss && (
        <BossSummonPopup
          bossName={summonedBoss.boss_key}
          bossRarity={summonedBoss.boss_rarity}
          onClose={() => setShowSummonPopup(false)}
        />
      )}
    </>
  );
};

export default BossPanel;
