'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { DuelChallengePopup } from '@/components/social/DuelChallengePopup';
import { DuelQuestModal } from '@/components/social/DuelQuestModal';
import { DuelResultPopup } from '@/components/social/DuelResultPopup';
import type { DuelData } from '@/components/social/DuelChallengePopup';

interface UseDuelNotificationsProps {
  currentUserId?: string | null;
}

async function getToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export function useDuelNotifications({ currentUserId }: UseDuelNotificationsProps) {
  const { locale } = useI18n();
  const [pendingChallenge, setPendingChallenge] = useState<DuelData | null>(null);
  const [activeDuelForAnswer, setActiveDuelForAnswer] = useState<DuelData | null>(null);
  const [completedDuel, setCompletedDuel] = useState<DuelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const checkedRef = useRef(false);

  const enrichDuel = useCallback(async (row: Record<string, unknown>): Promise<DuelData | null> => {
    if (!currentUserId) return null;
    const isChallenger = row.challenger_id === currentUserId;
    const opponentId = (isChallenger ? row.challenged_id : row.challenger_id) as string;
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', opponentId)
      .single();
    return {
      ...(row as unknown as DuelData),
      opponent_id: opponentId,
      opponent_nickname: (profile as { nickname: string } | null)?.nickname ?? 'Unknown',
      is_challenger: isChallenger,
    };
  }, [currentUserId]);

  // On login / page load: check for pending or unseen duels
  useEffect(() => {
    if (!currentUserId || checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      // 1. Pending challenge for me (challenged_id)
      const { data: pending } = await supabase
        .from('duels')
        .select('*')
        .eq('challenged_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        const enriched = await enrichDuel(pending as Record<string, unknown>);
        if (enriched) { setPendingChallenge(enriched); return; }
      }

      // 2. Challenger already answered — challenged user needs to reply
      const { data: needsAnswer } = await supabase
        .from('duels')
        .select('*')
        .eq('challenged_id', currentUserId)
        .eq('status', 'challenger_answered')
        .is('challenged_answer', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (needsAnswer) {
        const enriched = await enrichDuel(needsAnswer as Record<string, unknown>);
        if (enriched) { setActiveDuelForAnswer(enriched); return; }
      }

      // 3. Completed OR declined duel not yet seen by me
      const { data: unseen } = await supabase
        .from('duels')
        .select('*')
        .in('status', ['completed', 'declined'])
        .or(
          `and(challenger_id.eq.${currentUserId},challenger_seen.eq.false),and(challenged_id.eq.${currentUserId},challenged_seen.eq.false)`
        )
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (unseen) {
        const enriched = await enrichDuel(unseen as Record<string, unknown>);
        if (enriched) setCompletedDuel(enriched);
      }
    })();
  }, [currentUserId, enrichDuel]);

  const handleAcceptChallenge = useCallback(() => {
    if (!pendingChallenge) return;
    setPendingChallenge(null);
    setActiveDuelForAnswer(pendingChallenge);
  }, [pendingChallenge]);

  const handleDeclineChallenge = useCallback(async () => {
    if (!pendingChallenge) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      await fetch(`/api/duels/${pendingChallenge.id}/decline`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { /* best-effort */ }
    setPendingChallenge(null);
    setIsLoading(false);
  }, [pendingChallenge]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!activeDuelForAnswer) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/duels/${activeDuelForAnswer.id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answer, userLocale: locale }),
      });
      const data = await res.json() as { duel?: Record<string, unknown>; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      if (data.duel?.status === 'completed') {
        const enriched = await enrichDuel(data.duel);
        if (enriched) setCompletedDuel(enriched);
      }
      setActiveDuelForAnswer(null);
    } catch (err) {
      console.error('[useDuelNotifications] submit error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeDuelForAnswer, locale, enrichDuel]);

  const markResultSeen = useCallback(async () => {
    if (!completedDuel || !currentUserId) return;
    const token = await getToken();
    await fetch(`/api/duels/${completedDuel.id}/seen`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setCompletedDuel(null);
  }, [completedDuel, currentUserId]);

  return {
    pendingChallenge, activeDuelForAnswer, completedDuel, isLoading,
    handleAcceptChallenge, handleDeclineChallenge, handleSubmitAnswer,
    clearResult: markResultSeen,
    clearAnswer: () => setActiveDuelForAnswer(null),
  };
}

export function DuelNotificationWrapper() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const {
    pendingChallenge, activeDuelForAnswer, completedDuel, isLoading,
    handleAcceptChallenge, handleDeclineChallenge, handleSubmitAnswer,
    clearResult, clearAnswer,
  } = useDuelNotifications({ currentUserId: userId });

  if (!userId) return null;

  return (
    <>
      {pendingChallenge && (
        <DuelChallengePopup
          duel={pendingChallenge}
          onAccept={handleAcceptChallenge}
          onDecline={handleDeclineChallenge}
          isLoading={isLoading}
        />
      )}
      {activeDuelForAnswer && !pendingChallenge && (
        <DuelQuestModal
          duel={activeDuelForAnswer}
          onSubmit={handleSubmitAnswer}
          onClose={clearAnswer}
          isSubmitting={isLoading}
        />
      )}
      {completedDuel && !pendingChallenge && !activeDuelForAnswer && (
        <DuelResultPopup
          duel={completedDuel}
          currentUserId={userId}
          onClose={clearResult}
        />
      )}
    </>
  );
}
