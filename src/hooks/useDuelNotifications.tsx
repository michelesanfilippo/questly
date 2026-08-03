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

export function useDuelNotifications({ currentUserId }: UseDuelNotificationsProps) {
  const { locale } = useI18n();
  const [pendingChallenge, setPendingChallenge] = useState<DuelData | null>(null);
  const [activeDuelForAnswer, setActiveDuelForAnswer] = useState<DuelData | null>(null);
  const [completedDuel, setCompletedDuel] = useState<DuelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      // Pending challenge aimed at this user
      const { data: pending } = await supabase
        .from('duels')
        .select('*')
        .eq('challenged_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending && !seenIds.current.has(pending.id as string)) {
        const enriched = await enrichDuel(pending as Record<string, unknown>);
        if (enriched) { seenIds.current.add(pending.id as string); setPendingChallenge(enriched); }
      }

      // Awaiting this user's answer (challenger already answered)
      const { data: awaitingAnswer } = await supabase
        .from('duels')
        .select('*')
        .eq('challenged_id', currentUserId)
        .eq('status', 'challenger_answered')
        .eq('challenged_answer', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (awaitingAnswer && !seenIds.current.has(`ans-${awaitingAnswer.id}`)) {
        const enriched = await enrichDuel(awaitingAnswer as Record<string, unknown>);
        if (enriched) { seenIds.current.add(`ans-${awaitingAnswer.id as string}`); setActiveDuelForAnswer(enriched); }
      }
    })();
  }, [currentUserId, enrichDuel]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`duels-${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duels' }, async (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (row.challenged_id === currentUserId && row.status === 'pending') {
          const id = row.id as string;
          if (!seenIds.current.has(id)) {
            seenIds.current.add(id);
            const enriched = await enrichDuel(row);
            if (enriched) setPendingChallenge(enriched);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels' }, async (payload) => {
        const row = payload.new as Record<string, unknown>;
        const id = row.id as string;
        const isParticipant = row.challenger_id === currentUserId || row.challenged_id === currentUserId;
        if (!isParticipant) return;

        if (row.status === 'completed' && !seenIds.current.has(`res-${id}`)) {
          seenIds.current.add(`res-${id}`);
          const enriched = await enrichDuel(row);
          if (enriched) { setActiveDuelForAnswer(null); setPendingChallenge(null); setCompletedDuel(enriched); }
        }
        if (row.status === 'challenger_answered' && row.challenged_id === currentUserId && !seenIds.current.has(`ans-${id}`)) {
          seenIds.current.add(`ans-${id}`);
          const enriched = await enrichDuel(row);
          if (enriched) setActiveDuelForAnswer(enriched);
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [currentUserId, enrichDuel]);

  const handleAcceptChallenge = useCallback(async () => {
    if (!pendingChallenge) return;
    setPendingChallenge(null);
    setActiveDuelForAnswer(pendingChallenge);
  }, [pendingChallenge]);

  const handleDeclineChallenge = useCallback(async () => {
    if (!pendingChallenge) return;
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      await fetch(`/api/duels/${pendingChallenge.id}/answer`, {
        method: 'DELETE',
        headers: session.session?.access_token ? { Authorization: `Bearer ${session.session.access_token}` } : {},
      });
    } catch { /* best-effort */ }
    setPendingChallenge(null);
    setIsLoading(false);
  }, [pendingChallenge]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!activeDuelForAnswer) return;
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
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

  return {
    pendingChallenge, activeDuelForAnswer, completedDuel, isLoading,
    handleAcceptChallenge, handleDeclineChallenge, handleSubmitAnswer,
    clearResult: () => setCompletedDuel(null),
    clearAnswer: () => setActiveDuelForAnswer(null),
  };
}

/**
 * Self-contained wrapper that mounts duel popups globally.
 * Gets its own user ID from Supabase session.
 */
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
