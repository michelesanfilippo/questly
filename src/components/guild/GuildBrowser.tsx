'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import type { SupabaseProfile } from '@/types';

interface GuildSummary {
  id: string;
  name: string;
  description?: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [joiningGuildId, setJoiningGuildId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadGuilds() {
      setLoading(true);
      try {
        const res = await fetch('/api/guilds', { method: 'GET', credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load guilds');
        const payload = await res.json() as { guilds?: GuildSummary[] | { guilds?: GuildSummary[] } };
        const nextGuilds = Array.isArray(payload.guilds)
          ? payload.guilds
          : payload.guilds?.guilds ?? [];
        setGuilds(nextGuilds);
      } finally {
        setLoading(false);
      }
    }

    void loadGuilds();
  }, []);

  async function handleCreate() {
    const nextName = draftName.trim();
    if (!nextName || !currentUserId) return;

    const alreadyExists = guilds.some((guild) => guild.name.toLowerCase() === nextName.toLowerCase());
    if (alreadyExists) {
      setError(t('guild.name_exists'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const response = await fetch('/api/guilds', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name: nextName, description: draftDescription.trim() }),
    });

    if (response.ok) {
      setDraftName('');
      setDraftDescription('');
      setIsCreateOpen(false);
      const payload = await response.json() as { guild?: GuildSummary; profile?: SupabaseProfile };
      if (payload.guild) {
        setGuilds((prev) => [payload.guild as GuildSummary, ...prev]);
        onGuildChanged?.(payload.guild, payload.profile ?? null);
      }
      setIsSubmitting(false);
      return;
    }

    const payload = await response.json().catch(() => ({})) as { error?: string };
    setError(payload.error ?? t('guild.create_error'));
    setIsSubmitting(false);
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-serif text-lg font-bold text-amber-900">{t('guild.title')}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            disabled={!currentUserId || !!profile?.guild_id}
            className="rounded-sm bg-amber-700 px-2.5 py-1.5 text-xs font-semibold text-amber-50 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {t('guild.create_cta')}
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{t('guild.ready')}</span>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-stone-500">{t('social.loading')}</p>
      ) : guilds.length === 0 ? (
        <p className="text-sm text-stone-500">{t('guild.empty')}</p>
      ) : (
        <div className="space-y-2">
          {guilds.map((guild) => (
            <div key={guild.id} className="rounded-sm border border-amber-800/10 bg-amber-50/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900">{guild.name}</p>
                  {guild.description ? <p className="mt-1 text-xs text-stone-600">{guild.description}</p> : null}
                  <p className="mt-1 text-xs text-stone-500">{t('guild.level_label', { n: guild.level })}</p>
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

      {isCreateOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-sm border border-amber-800/20 bg-[#fffdf8] p-4 shadow-xl">
            <div className="mb-3">
              <h4 className="font-serif text-lg font-bold text-amber-900">{t('guild.create_title')}</h4>
              <p className="text-sm text-stone-600">{t('guild.create_subtitle')}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-stone-700">{t('guild.name_label')}</label>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder={t('guild.create_placeholder')}
                  className="w-full rounded-sm border border-amber-800/20 bg-white px-3 py-2 text-sm text-stone-700 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-stone-700">{t('guild.description_label')}</label>
                <textarea
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  placeholder={t('guild.description_placeholder')}
                  rows={3}
                  className="w-full rounded-sm border border-amber-800/20 bg-white px-3 py-2 text-sm text-stone-700 outline-none"
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setIsCreateOpen(false); setDraftName(''); setDraftDescription(''); setError(null); }} className="rounded-sm border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-600">
                  {t('guild.cancel')}
                </button>
                <button type="button" onClick={() => { void handleCreate(); }} disabled={isSubmitting || !draftName.trim()} className="rounded-sm bg-amber-700 px-3 py-2 text-sm font-semibold text-amber-50 disabled:cursor-not-allowed disabled:bg-stone-300">
                  {isSubmitting ? t('guild.creating') : t('guild.create_cta')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
