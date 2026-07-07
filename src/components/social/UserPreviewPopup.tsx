'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { getBadgeImagePath } from '@/lib/badges';
import { friendshipStatus, sendRequest, type FriendshipStatus } from '@/lib/friends';

interface UserPreviewPopupProps {
  userId: string;
  currentUserId?: string;
  onClose: () => void;
}

interface ProfilePreview {
  id: string;
  nickname: string;
  level: number;
  profile_badge_index: number | null;
}

export function UserPreviewPopup({ userId, currentUserId, onClose }: UserPreviewPopupProps) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfilePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<FriendshipStatus>('none');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id,nickname,level,profile_badge_index')
        .eq('id', userId)
        .single();

      if (!cancelled && !error && data) {
        setProfile(data as ProfilePreview);
        const status = await friendshipStatus(userId, data.id, currentUserId);
        if (!cancelled) setFriendship(status);
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, currentUserId]);

  const isMe = Boolean(currentUserId && currentUserId === userId);

  async function handleFriendAction() {
    if (!currentUserId || isMe) return;
    const nextStatus = await sendRequest(userId, currentUserId);
    setFriendship(nextStatus);
  }

  function getFriendButtonLabel() {
    if (isMe) return t('social.you');
    if (friendship === 'friends') return t('friends.accepted');
    if (friendship === 'pending_outgoing') return t('friends.pending_outgoing');
    if (friendship === 'pending_incoming') return t('friends.pending_incoming');
    return t('social.friend_cta');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          key="user-preview"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-6 shadow-[2px_4px_16px_rgba(101,67,33,0.25)]"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 text-lg leading-none text-stone-400 transition-colors hover:text-stone-600"
            aria-label={t('social.close')}
          >
            ×
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-amber-800/20 bg-amber-100">
              {profile?.profile_badge_index != null ? (
                <Image
                  src={getBadgeImagePath(profile.profile_badge_index)}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-amber-800">
                  {profile?.nickname?.slice(0, 1).toUpperCase() ?? '?'}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-serif text-lg font-bold text-amber-900">
                {loading ? t('social.loading') : profile?.nickname ?? t('social.not_found')}
              </h3>
              {!loading && profile && (
                <p className="text-sm text-stone-600">
                  {t('user.level', { n: profile.level })}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-stone-500">{t('social.loading')}</p>
          ) : profile ? (
            <>
              <div className="rounded-sm border border-amber-800/10 bg-amber-50/60 p-3 text-sm text-stone-600">
                <p>{t('social.preview_hint')}</p>
              </div>
              <button
                type="button"
                disabled={isMe || friendship === 'friends' || friendship === 'pending_outgoing' || friendship === 'pending_incoming'}
                onClick={handleFriendAction}
                className={`mt-4 w-full rounded-sm border px-3 py-2 text-sm font-semibold transition-colors ${
                  isMe || friendship === 'friends' || friendship === 'pending_outgoing' || friendship === 'pending_incoming'
                    ? 'cursor-not-allowed border-stone-300 bg-stone-200 text-stone-500'
                    : 'border-amber-700 bg-amber-700 text-amber-50 hover:bg-amber-800'
                }`}
              >
                {getFriendButtonLabel()}
              </button>
              <p className="mt-2 text-center text-[11px] text-stone-500">
                {friendship === 'friends' ? t('friends.connected') : t('social.friend_soon')}
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-500">{t('social.not_found')}</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
