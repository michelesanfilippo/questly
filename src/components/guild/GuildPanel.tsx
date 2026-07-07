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
  const [guildRole, setGuildRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ user_id: string; role: string; nickname: string | null }>>([]);

  useEffect(() => {
    if (!profile?.id) {
      setGuildName(null);
      setGuildRole(null);
      setMembers([]);
      return;
    }

    if (accessState !== 'member') {
      setGuildName(null);
      setGuildRole(null);
      setMembers([]);
      return;
    }

    async function loadCurrentGuild() {
      try {
        const response = await fetch('/api/guilds?scope=members', { credentials: 'include' });
        if (!response.ok) return;
        const payload = await response.json() as { guild?: { name?: string } | null; role?: string | null; members?: Array<{ user_id: string; role: string; nickname: string | null }> };
        setGuildName(payload.guild?.name ?? null);
        setGuildRole(payload.role ?? null);
        setMembers(payload.members ?? []);
      } catch {
        setGuildName(null);
        setGuildRole(null);
        setMembers([]);
      }
    }

    void loadCurrentGuild();
  }, [accessState, profile?.id]);

  function handleGuildChanged(nextGuild: { name: string } | null, nextProfile: SupabaseProfile | null) {
    setGuildName(nextGuild?.name ?? null);
    setGuildRole('leader');
    setMembers([]);
    onProfileUpdate?.(nextProfile);
  }

  if (accessState === 'logged_out') {
    return null;
  }

  return (
    <div className="rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-4 shadow-[2px_4px_12px_rgba(101,67,33,0.2)]">
      <div className="mb-3">
        <h3 className="font-serif text-lg font-bold text-amber-900">{t('guild.title')}</h3>
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
        <div className="space-y-3 text-sm text-stone-600">
          <p>{t('guild.member_message')}</p>
          <div className="rounded-sm border border-amber-800/10 bg-amber-50/70 px-3 py-2">
            <p className="text-sm font-semibold text-amber-900">{guildName ?? t('guild.member_placeholder')}</p>
            <p className="text-xs text-stone-500">
              {guildRole ? t('guild.role_label', { role: guildRole === 'leader' ? t('guild.role_leader') : t('guild.role_member') }) : t('guild.member_hint')}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">{t('guild.members')}</p>
            {members.length === 0 ? (
              <p className="text-sm text-stone-500">{t('guild.no_members')}</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between rounded-sm border border-amber-800/10 bg-white/70 px-2 py-2">
                    <span className="text-sm text-stone-700">{member.nickname ?? t('guild.unknown_member')}</span>
                    <span className="rounded-full border border-amber-800/10 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                      {member.role === 'leader' ? t('guild.role_leader') : t('guild.role_member')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-stone-600">
          <GuildBrowser currentUserId={profile?.id} profile={profile} onGuildChanged={handleGuildChanged} />
          <p className="text-xs text-stone-500">{t('guild.preview_hint')}</p>
        </div>
      )}
    </div>
  );
}
