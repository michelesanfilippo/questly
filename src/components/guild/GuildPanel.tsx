'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { GuildBrowser } from '@/components/guild/GuildBrowser';
import { getGuildAccessState } from '@/lib/guilds';
import type { SupabaseProfile } from '@/types';

interface GuildPanelProps {
  profile: SupabaseProfile | null;
  onProfileUpdate?: (profile: SupabaseProfile | null) => void;
}

export function GuildPanel({ profile, onProfileUpdate }: GuildPanelProps) {
  const { t } = useI18n();
  const accessState = useMemo(() => getGuildAccessState(profile), [profile]);
  const [guildName, setGuildName] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) {
      setGuildName(null);
      return;
    }

    if (accessState !== 'member') {
      setGuildName(null);
      return;
    }

    async function loadCurrentGuild() {
      try {
        const response = await fetch('/api/guilds?scope=current', { credentials: 'include' });
        if (!response.ok) return;
        const payload = await response.json() as { guild?: { name?: string } | null };
        setGuildName(payload.guild?.name ?? null);
      } catch {
        setGuildName(null);
      }
    }

    void loadCurrentGuild();
  }, [accessState, profile?.id]);

  function handleGuildChanged(nextGuild: { name: string } | null, nextProfile: SupabaseProfile | null) {
    setGuildName(nextGuild?.name ?? null);
    onProfileUpdate?.(nextProfile);
  }

  if (accessState === 'logged_out') {
    return null;
  }

  return (
    <div className="rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-4 shadow-[2px_4px_12px_rgba(101,67,33,0.2)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-amber-900">{t('guild.title')}</h3>
        <span className="rounded-full border border-amber-800/20 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
          {accessState === 'locked' ? t('guild.locked') : accessState === 'member' ? t('guild.member') : t('guild.ready')}
        </span>
      </div>

      {accessState === 'locked' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="text-xl" aria-hidden="true">🔒</span>
            <p className="text-sm font-semibold">{t('guild.locked_title')}</p>
          </div>
          <p className="text-sm text-stone-600">{t('guild.locked_message')}</p>
        </div>
      ) : accessState === 'member' ? (
        <div className="space-y-2 text-sm text-stone-600">
          <p>{t('guild.member_message')}</p>
          <div className="rounded-sm border border-amber-800/10 bg-amber-50/70 px-3 py-2">
            <p className="text-sm font-semibold text-amber-900">{guildName ?? t('guild.member_placeholder')}</p>
            <p className="text-xs text-stone-500">{t('guild.member_hint')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-stone-600">
          <p>{t('guild.ready_message')}</p>
          <GuildBrowser currentUserId={profile?.id} profile={profile} onGuildChanged={handleGuildChanged} />
          <p className="text-xs text-stone-500">{t('guild.preview_hint')}</p>
        </div>
      )}
    </div>
  );
}
