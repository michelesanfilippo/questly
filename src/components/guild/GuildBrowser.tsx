'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import type { SupabaseProfile } from '@/types';

interface GuildSummary {
  id: string;
  name: string;
  level: number;
  xp: number;
  founder_id: string;
  created_at: string;
}

interface GuildBrowserProps {
  currentUserId?: string;
  profile?: SupabaseProfile | null;
  onGuildChanged?: (guild: GuildSummary | null, profile: SupabaseProfile | null) => void;
}

export function GuildBrowser({ currentUserId, profile, onGuildChanged }: GuildBrowserProps) {
  const { t } = useI18n();
  const [guilds, setGuilds] = useState<GuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joiningGuildId, setJoiningGuildId] = useState<string | null>(null);

  useEffect(() => {
    async function loadGuilds() {
      setLoading(true);
      try {
        const res = await fetch('/api/guilds', { method: 'GET', credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load guilds');
        const payload = await res.json() as { guilds?: GuildSummary[] };
        setGuilds(payload.guilds ?? []);
      } finally {
        setLoading(false);
      }
    }

    void loadGuilds();
  }, []);

  async function handleCreate() {
    if (!name.trim() || !currentUserId) return;
    setError(null);
    const response = await fetch('/api/guilds', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name: name.trim() }),
    });

    if (response.ok) {
      setName('');
      const payload = await response.json() as { guild?: GuildSummary; profile?: SupabaseProfile };
      if (payload.guild) {
        setGuilds((prev) => [payload.guild as GuildSummary, ...prev]);
        onGuildChanged?.(payload.guild, payload.profile ?? null);
      }
      return;
    }

    const payload = await response.json().catch(() => ({})) as { error?: string };
    setError(payload.error ?? t('guild.create_error'));
  }

  async function handleJoin(guildId: string) {
    if (!currentUserId) return;
    setJoiningGuildId(guildId);
    setError(null);
    const response = await fetch('/api/guilds', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', guildId }),
    });

    if (response.ok) {
      const payload = await response.json() as { guild?: GuildSummary; profile?: SupabaseProfile };
      if (payload.guild) {
        onGuildChanged?.(payload.guild, payload.profile ?? null);
      }
      setJoiningGuildId(null);
      return;
    }

    const payload = await response.json().catch(() => ({})) as { error?: string };
    setError(payload.error ?? t('guild.join_error'));
    setJoiningGuildId(null);
  }

  return (
    <div className="rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-4 shadow-[2px_4px_12px_rgba(101,67,33,0.2)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-amber-900">{t('guild.title')}</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{t('guild.ready')}</span>
      </div>

      <div className="mb-3 space-y-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('guild.create_placeholder')}
          className="w-full rounded-sm border border-amber-800/20 bg-white px-3 py-2 text-sm text-stone-700 outline-none"
        />
        <button
          type="button"
          onClick={() => { void handleCreate(); }}
          disabled={!currentUserId || !!profile?.guild_id}
          className="w-full rounded-sm bg-amber-700 px-3 py-2 text-sm font-semibold text-amber-50 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {t('guild.create_cta')}
        </button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-stone-500">{t('social.loading')}</p>
      ) : guilds.length === 0 ? (
        <p className="text-sm text-stone-500">{t('guild.empty')}</p>
      ) : (
        <div className="space-y-2">
          {guilds.map((guild) => (
            <div key={guild.id} className="rounded-sm border border-amber-800/10 bg-amber-50/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-amber-900">{guild.name}</p>
                  <p className="text-xs text-stone-500">{t('guild.level_label', { n: guild.level })}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { void handleJoin(guild.id); }}
                  disabled={!!profile?.guild_id || joiningGuildId === guild.id}
                  className="rounded-sm border border-amber-700 px-2 py-1 text-xs font-semibold text-amber-700 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400"
                >
                  {profile?.guild_id === guild.id ? t('guild.joined') : joiningGuildId === guild.id ? t('guild.joining') : t('guild.join')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
