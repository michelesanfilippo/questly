'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { getBadgeImagePath } from '@/lib/badges';
import { friendshipStatus, sendRequest, type FriendshipStatus } from '@/lib/friends';

const GUILD_BADGE_IMG = '/images/badges/badge_guild.png';

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
  guild_id: string | null;
}

interface GuildInfo {
  id: string;
  name: string;
  icon_key: string | null;
}

type ApplyStatus = 'idle' | 'loading' | 'applied' | 'error';

export function UserPreviewPopup({ userId, currentUserId, onClose }: UserPreviewPopupProps) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfilePreview | null>(null);
  const [guild, setGuild] = useState<GuildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<FriendshipStatus>('none');
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>('idle');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [currentUserInGuild, setCurrentUserInGuild] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setGuild(null);
      setApplyStatus('idle');
      setApplyError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('id,nickname,level,profile_badge_index,guild_id')
        .eq('id', userId)
        .single();

      if (!cancelled && !error && data) {
        const p = data as ProfilePreview;
        setProfile(p);

        // Fetch guild info if user belongs to one
        if (p.guild_id) {
          const { data: gd } = await supabase
            .from('guilds')
            .select('id,name,icon_key')
            .eq('id', p.guild_id)
            .single();
          if (!cancelled && gd) setGuild(gd as GuildInfo);
        }

        // Check if current user is already in a guild
        if (currentUserId && currentUserId !== userId) {
          const { data: cu } = await supabase
            .from('profiles')
            .select('guild_id')
            .eq('id', currentUserId)
            .single();
          if (!cancelled) setCurrentUserInGuild(Boolean((cu as { guild_id: string | null } | null)?.guild_id));
        }

        const status = await friendshipStatus(userId, data.id, currentUserId);
        if (!cancelled) setFriendship(status);
      }

      if (!cancelled) setLoading(false);
    }

    void loadProfile();
    return () => { cancelled = true; };
  }, [userId, currentUserId]);

  const isMe = Boolean(currentUserId && currentUserId === userId);

  async function handleFriendAction() {
    if (!currentUserId || isMe) return;
    const nextStatus = await sendRequest(userId, currentUserId);
    setFriendship(nextStatus);
  }

  async function handleApply() {
    if (!currentUserId || !guild) return;
    setApplyStatus('loading');
    setApplyError(null);
    try {
      const res = await fetch('/api/guilds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', guildId: guild.id }),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) {
        setApplyStatus('error');
        setApplyError(payload.error ?? t('guild.apply_error'));
      } else {
        setApplyStatus('applied');
      }
    } catch {
      setApplyStatus('error');
      setApplyError(t('guild.apply_error'));
    }
  }

  function getFriendButtonLabel() {
    if (isMe) return t('social.you');
    if (friendship === 'friends') return t('friends.accepted');
    if (friendship === 'pending_outgoing') return t('friends.pending_request');
    if (friendship === 'pending_incoming') return t('friends.pending_incoming');
    return t('social.friend_cta');
  }

  function renderGuildIcon(g: GuildInfo, size: number) {
    if (g.icon_key === 'badge_guild') {
      return <Image src={GUILD_BADGE_IMG} alt="" width={size} height={size} className="h-full w-full object-cover" />;
    }
    if (g.icon_key) {
      return <span style={{ fontSize: size * 0.6 }} className="leading-none">{g.icon_key}</span>;
    }
    return <span className="text-xs font-bold text-amber-800">{g.name.slice(0, 2).toUpperCase()}</span>;
  }

  const canApply = Boolean(currentUserId && !isMe && guild);
  const applyDisabled = applyStatus === 'loading' || applyStatus === 'applied' || currentUserInGuild;

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
              {/* Guild section */}
              {guild ? (
                <div className="mb-3 rounded-sm border border-amber-800/10 bg-amber-50/60 p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">{t('guild.title')}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative group shrink-0">
                        <div className="h-7 w-7 overflow-hidden rounded-full border border-amber-800/20 bg-amber-100 flex items-center justify-center">
                          {renderGuildIcon(guild, 28)}
                        </div>
                        {/* Hover zoom — icon only */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden group-hover:flex pointer-events-none">
                          <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-amber-300/60 bg-amber-100 flex items-center justify-center shadow-[0_0_16px_rgba(217,119,6,0.45)]">
                            {renderGuildIcon(guild, 56)}
                          </div>
                        </div>
                      </div>
                      <span className="truncate text-sm font-semibold text-amber-900">{guild.name}</span>
                    </div>
                    {canApply && (
                      <button
                        type="button"
                        onClick={handleApply}
                        disabled={applyDisabled}
                        title={currentUserInGuild ? t('guild.already_in_guild') : undefined}
                        className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          applyStatus === 'applied'
                            ? 'cursor-not-allowed border-emerald-400 bg-emerald-100 text-emerald-700'
                            : applyDisabled
                            ? 'cursor-not-allowed border-stone-300 bg-stone-100 text-stone-400'
                            : 'border-amber-600 bg-amber-700 text-amber-50 hover:bg-amber-800'
                        }`}
                      >
                        {applyStatus === 'loading'
                          ? t('guild.applying')
                          : applyStatus === 'applied'
                          ? '✓ ' + t('guild.apply')
                          : t('guild.apply')}
                      </button>
                    )}
                  </div>
                  {applyStatus === 'error' && applyError && (
                    <p className="mt-1.5 text-[11px] text-red-600">{applyError}</p>
                  )}
                  {applyStatus === 'applied' && (
                    <p className="mt-1.5 text-[11px] text-emerald-700">{t('guild.request_sent')}</p>
                  )}
                </div>
              ) : (
                <div className="mb-3 rounded-sm border border-amber-800/10 bg-amber-50/60 p-3 text-sm text-stone-500 italic">
                  {t('guild.no_guild')}
                </div>
              )}

              <button
                type="button"
                disabled={isMe || friendship === 'friends' || friendship === 'pending_outgoing' || friendship === 'pending_incoming'}
                onClick={handleFriendAction}
                className={`w-full rounded-sm border px-3 py-2 text-sm font-semibold transition-colors ${
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
