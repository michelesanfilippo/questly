'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { getBadgeImagePath } from '@/lib/badges';
import { listFriends, listIncomingRequests, removeFriend, respondRequest, subscribeToFriendshipChanges } from '@/lib/friends';
import { DuelQuestModal } from '@/components/social/DuelQuestModal';
import type { DuelData } from '@/components/social/DuelChallengePopup';

interface FriendsCardProps {
  currentUserId?: string;
  profileLevel?: number;
}

interface FriendProfile {
  id: string;
  nickname: string;
  level: number;
  profile_badge_index: number | null;
}

export function FriendsCard({ currentUserId, profileLevel }: FriendsCardProps) {
  const { t, locale } = useI18n();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<Array<{ userId: string; nickname?: string; requestedBy: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [friendToRemove, setFriendToRemove] = useState<FriendProfile | null>(null);
  const [removing, setRemoving] = useState(false);
  // Duel state
  const [duelTarget, setDuelTarget] = useState<FriendProfile | null>(null);
  const [duelLoading, setDuelLoading] = useState(false);
  const [duelError, setDuelError] = useState<string | null>(null);
  const [activeDuel, setActiveDuel] = useState<DuelData | null>(null);

  const loadData = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const friendIds = await listFriends(currentUserId);
      const { data } = await supabase.from('profiles').select('id,nickname,level,profile_badge_index').in('id', friendIds);
      setFriends((data as FriendProfile[] | null)?.filter(Boolean) ?? []);
      setRequests(await listIncomingRequests(currentUserId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const unsubscribe = subscribeToFriendshipChanges(() => {
      void loadData();
    });
    return unsubscribe;
  }, [currentUserId]);

  const countText = useMemo(() => `${friends.length}/20`, [friends.length]);

  async function handleRemoveFriend() {
    if (!currentUserId || !friendToRemove) return;
    setRemoving(true);
    const removed = await removeFriend(friendToRemove.id, currentUserId);
    if (removed) { await loadData(); }
    setRemoving(false);
    setFriendToRemove(null);
  }

  async function handleChallenge(friend: FriendProfile) {
    if (!currentUserId) return;
    setDuelLoading(true);
    setDuelError(null);
    setDuelTarget(friend);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/duels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ challengedId: friend.id }),
      });
      const data = await res.json() as { duel?: DuelData; error?: string };
      if (!res.ok) throw new Error(data.error ?? t('duel.error_create'));
      // Open the quest modal so challenger can also answer immediately
      if (data.duel) {
        setActiveDuel({
          ...data.duel,
          opponent_id: friend.id,
          opponent_nickname: friend.nickname,
          is_challenger: true,
        });
      }
    } catch (err) {
      setDuelError(err instanceof Error ? err.message : t('duel.error_create'));
      setDuelTarget(null);
    } finally {
      setDuelLoading(false);
    }
  }

  async function handleSubmitDuelAnswer(answer: string) {
    if (!activeDuel) return;
    setDuelLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/duels/${activeDuel.id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answer, userLocale: locale }),
      });
      if (!res.ok) { const d = await res.json() as { error?: string }; throw new Error(d.error ?? t('duel.error_answer')); }
      setActiveDuel(null);
      setDuelTarget(null);
    } catch (err) {
      setDuelError(err instanceof Error ? err.message : t('duel.error_answer'));
    } finally {
      setDuelLoading(false);
    }
  }

  return (
    <div className="rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-4 shadow-[2px_4px_12px_rgba(101,67,33,0.2)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-amber-900">{t('friends.title')}</h3>
        <span className="text-xs font-semibold text-stone-500">{countText}</span>
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">{t('social.loading')}</p>
      ) : (
        <>
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {t('friends.title')}
            </p>
            {friends.length === 0 ? (
              <p className="text-sm text-stone-500">{t('friends.empty')}</p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-2 rounded-sm border border-amber-800/10 bg-amber-50/60 px-2 py-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full border border-amber-800/20 bg-amber-100">
                      {friend.profile_badge_index != null ? (
                        <Image src={getBadgeImagePath(friend.profile_badge_index)} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-amber-800">
                          {friend.nickname.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-amber-900">{friend.nickname}</p>
                      <p className="text-xs text-stone-500">{t('user.level', { n: friend.level })}</p>
                    </div>
                    {/* Duel challenge button */}
                    <button
                      type="button"
                      onClick={() => { void handleChallenge(friend); }}
                      disabled={duelLoading && duelTarget?.id === friend.id}
                      title={t('duel.challenge_cta')}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-amber-600 text-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
                    >
                      ⚔️
                    </button>
                    <button
                      type="button"
                      onClick={() => setFriendToRemove(friend)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700"
                      aria-label={t('friends.remove_friend')}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {t('friends.pending')}
            </p>
            {requests.length === 0 ? (
              <p className="text-sm text-stone-500">{t('friends.none')}</p>
            ) : (
              <div className="space-y-2">
                {requests.map((request) => (
                  <div key={request.userId} className="rounded-sm border border-amber-800/10 bg-white/70 p-2">
                    <p className="text-sm font-semibold text-amber-900">{request.nickname ?? request.userId}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            await respondRequest(request.userId, true, currentUserId);
                            await loadData();
                          })();
                        }}
                        className="rounded-sm bg-amber-700 px-2 py-1 text-xs font-semibold text-amber-50"
                      >
                        {t('friends.accept')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            await respondRequest(request.userId, false, currentUserId);
                            await loadData();
                          })();
                        }}
                        className="rounded-sm border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600"
                      >
                        {t('friends.reject')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {profileLevel !== undefined && profileLevel < 6 && (
            <p className="mt-3 text-xs text-stone-500">{t('friends.locked')}</p>
          )}

          {/* Duel error toast */}
          {duelError && (
            <p className="mt-2 text-xs text-red-600 text-center">{duelError}</p>
          )}
        </>
      )}

      {/* Remove confirm modal */}
      {friendToRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-5 shadow-[2px_4px_16px_rgba(101,67,33,0.25)]">
            <h4 className="font-serif text-lg font-bold text-amber-900">{t('friends.remove_confirm_title')}</h4>
            <p className="mt-2 text-sm text-stone-600">{t('friends.remove_confirm_text', { nickname: friendToRemove.nickname })}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFriendToRemove(null)}
                className="rounded-sm border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-600"
              >
                {t('social.close')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleRemoveFriend();
                }}
                disabled={removing}
                className="rounded-sm bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {removing ? t('social.loading') : t('friends.remove_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duel quest modal — challenger submits their answer after creating the duel */}
      {activeDuel && (
        <DuelQuestModal
          duel={activeDuel}
          onSubmit={handleSubmitDuelAnswer}
          onClose={() => { setActiveDuel(null); setDuelTarget(null); }}
          isSubmitting={duelLoading}
        />
      )}
    </div>
  );
}
