'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/i18n';
import { GuildBrowser } from '@/components/guild/GuildBrowser';
import { getGuildAccessState } from '@/lib/guilds';
import { getBadgeImagePath } from '@/lib/badges';
import { UserPreviewPopup } from '@/components/social/UserPreviewPopup';
import type { SupabaseProfile } from '@/types';

interface GuildPanelProps {
  profile: SupabaseProfile | null;
  onProfileUpdate?: (profile: SupabaseProfile | null) => void;
}

interface Member {
  user_id: string;
  role: string;
  nickname: string | null;
  profile_badge_index: number | null;
}

interface RequestEntry {
  id: string;
  user_id: string;
  nickname: string | null;
  level: number | null;
  profile_badge_index: number | null;
}

type HolderEntry = { id: string; nickname: string | null; profile_badge_index: number | null };

export function GuildPanel({ profile, onProfileUpdate }: GuildPanelProps) {
  const { t } = useI18n();
  const accessState = useMemo(() => getGuildAccessState(profile), [profile]);

  const [guildName, setGuildName] = useState<string | null>(null);
  const [guildRole, setGuildRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  // Quit
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [quitError, setQuitError] = useState<string | null>(null);
  // Pending requests popup
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<RequestEntry[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  // Kick popup
  const [kickTarget, setKickTarget] = useState<Member | null>(null);
  const [isKicking, setIsKicking] = useState(false);
  const [kickError, setKickError] = useState<string | null>(null);
  // Assign role (demote-picker popup when slot is full)
  const [assignTarget, setAssignTarget] = useState<{ member: Member; role: 'royal_knight' | 'wizard' } | null>(null);
  const [assignHolders, setAssignHolders] = useState<HolderEntry[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  // User preview
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  const loadCurrentGuild = useCallback(async () => {
    try {
      const response = await fetch('/api/guilds?scope=members', { credentials: 'include' });
      if (!response.ok) return;
      const payload = await response.json() as {
        guild?: { name?: string } | null;
        role?: string | null;
        members?: Member[];
        requestCount?: number;
      };
      setGuildName(payload.guild?.name ?? null);
      setGuildRole(payload.role ?? null);
      setMembers(payload.members ?? []);
      setRequestCount(payload.requestCount ?? 0);
    } catch {
      setGuildName(null);
      setGuildRole(null);
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    if (!profile?.id || accessState !== 'member') {
      setGuildName(null);
      setGuildRole(null);
      setMembers([]);
      setRequestCount(0);
      return;
    }
    void loadCurrentGuild();
  }, [accessState, profile?.id, loadCurrentGuild]);

  async function handleQuit() {
    setIsQuitting(true);
    setQuitError(null);
    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' }),
      });
      if (response.ok) {
        const payload = await response.json() as { profile?: SupabaseProfile };
        setIsQuitOpen(false);
        onProfileUpdate?.(payload.profile ?? null);
        return;
      }
      const payload = await response.json().catch(() => ({})) as { error?: string };
      setQuitError(payload.error ?? t('guild.leave_error'));
    } catch {
      setQuitError(t('guild.leave_error'));
    } finally {
      setIsQuitting(false);
    }
  }

  async function handleKick() {
    if (!kickTarget) return;
    setIsKicking(true);
    setKickError(null);
    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kick', targetUserId: kickTarget.user_id }),
      });
      if (response.ok) {
        setKickTarget(null);
        void loadCurrentGuild();
        return;
      }
      const payload = await response.json().catch(() => ({})) as { error?: string };
      setKickError(payload.error ?? t('guild.kick_error'));
    } catch {
      setKickError(t('guild.kick_error'));
    } finally {
      setIsKicking(false);
    }
  }

  async function handleAssignRole(targetUserId: string, role: 'royal_knight' | 'wizard', demoteUserId?: string) {
    setIsAssigning(true);
    if (!demoteUserId) setAssignError(null);
    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_role', targetUserId, role, demoteUserId }),
      });
      const data = await response.json() as {
        assigned?: boolean;
        needsDemote?: boolean;
        holders?: HolderEntry[];
        error?: string;
      };
      if (response.ok && data.needsDemote) {
        const member = members.find((m) => m.user_id === targetUserId);
        if (member) { setAssignTarget({ member, role }); setAssignHolders(data.holders ?? []); }
        return;
      }
      if (response.ok) {
        setAssignTarget(null);
        void loadCurrentGuild();
        return;
      }
      setAssignError(data.error ?? t('guild.assign_error'));
    } catch {
      setAssignError(t('guild.assign_error'));
    } finally {
      setIsAssigning(false);
    }
  }

  async function openPendingRequests() {
    setIsPendingOpen(true);
    setIsPendingLoading(true);
    try {
      const response = await fetch('/api/guilds?scope=requests', { credentials: 'include' });
      if (!response.ok) return;
      const payload = await response.json() as { requests?: RequestEntry[] };
      setPendingRequests(payload.requests ?? []);
    } finally {
      setIsPendingLoading(false);
    }
  }

  async function handleRespond(requestId: string, accept: boolean) {
    setRespondingId(requestId);
    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'respond_request', requestId, accept }),
      });
      if (response.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        setRequestCount((prev) => Math.max(0, prev - 1));
        if (accept) void loadCurrentGuild();
      }
    } finally {
      setRespondingId(null);
    }
  }

  function handleGuildChanged(nextGuild: { name: string } | null, nextProfile: SupabaseProfile | null) {
    setGuildName(nextGuild?.name ?? null);
    setGuildRole('leader');
    setMembers([]);
    onProfileUpdate?.(nextProfile);
  }

  const isLeader = guildRole === 'leader';
  const isManagement = ['leader', 'royal_knight', 'wizard'].includes(guildRole ?? '');
  const currentUserId = profile?.id;

  function canKick(member: Member) {
    if (member.user_id === currentUserId) return false;
    if (member.role === 'leader') return false;
    if (isLeader) return true;
    if (isManagement && member.role === 'member') return true;
    return false;
  }

  function getRoleLabel(role: string): string {
    switch (role) {
      case 'leader': return t('guild.role_leader');
      case 'royal_knight': return t('guild.role_royal_knight');
      case 'wizard': return t('guild.role_wizard');
      default: return t('guild.role_member');
    }
  }

  function roleBadgeClass(role: string): string {
    switch (role) {
      case 'leader': return 'bg-amber-100 text-amber-800 border-amber-800/10';
      case 'royal_knight': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'wizard': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  }

  if (accessState === 'logged_out') return null;

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
          <p className="text-xs">{t('guild.member_message')}</p>

          {/* Guild name + role + requests button */}
          <div className="rounded-sm border border-amber-800/10 bg-amber-50/70 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">{guildName ?? t('guild.member_placeholder')}</p>
                <p className="text-xs text-stone-500">
                  {guildRole ? t('guild.role_label', { role: getRoleLabel(guildRole) }) : t('guild.member_hint')}
                </p>
              </div>
              {isManagement ? (
                <button
                  type="button"
                  onClick={() => { void openPendingRequests(); }}
                  className="relative flex shrink-0 items-center gap-1 rounded-sm border border-amber-700/40 px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100"
                >
                  📋 {t('guild.pending_requests')}
                  {requestCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {requestCount}
                    </span>
                  ) : null}
                </button>
              ) : null}
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">{t('guild.members')}</p>
            {members.length === 0 ? (
              <p className="text-sm text-stone-500">{t('guild.no_members')}</p>
            ) : (
              <div className="space-y-1.5">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-2 rounded-sm border border-amber-800/10 bg-amber-50/60 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => member.user_id !== currentUserId && setPreviewUserId(member.user_id)}
                      className={`flex min-w-0 flex-1 items-center gap-2 text-left ${member.user_id !== currentUserId ? 'cursor-pointer' : ''}`}
                    >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-amber-800/20 bg-amber-100">
                      {member.profile_badge_index != null ? (
                        <Image src={getBadgeImagePath(member.profile_badge_index)} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-amber-800">
                          {(member.nickname ?? '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-amber-900">{member.nickname ?? t('guild.unknown_member')}</p>
                    </div>
                    </button>
                    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${roleBadgeClass(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                    {/* Leader action buttons */}
                    {isLeader && member.user_id !== currentUserId && member.role !== 'leader' ? (
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          title={t('guild.assign_knight_cta')}
                          onClick={() => { void handleAssignRole(member.user_id, 'royal_knight'); }}
                          disabled={isAssigning}
                          className={`rounded px-1 py-0.5 text-sm leading-none transition-colors disabled:cursor-not-allowed ${member.role === 'royal_knight' ? 'bg-indigo-200 text-indigo-800' : 'bg-stone-100 text-stone-400 hover:bg-indigo-100 hover:text-indigo-700'}`}
                        >
                          👑
                        </button>
                        <button
                          type="button"
                          title={t('guild.assign_wizard_cta')}
                          onClick={() => { void handleAssignRole(member.user_id, 'wizard'); }}
                          disabled={isAssigning}
                          className={`rounded px-1 py-0.5 text-sm leading-none transition-colors disabled:cursor-not-allowed ${member.role === 'wizard' ? 'bg-purple-200 text-purple-800' : 'bg-stone-100 text-stone-400 hover:bg-purple-100 hover:text-purple-700'}`}
                        >
                          🔮
                        </button>
                        <button
                          type="button"
                          title={t('guild.kick')}
                          onClick={() => setKickTarget(member)}
                          className="rounded px-1 py-0.5 text-xs leading-none font-bold text-stone-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : canKick(member) ? (
                      <button
                        type="button"
                        title={t('guild.kick')}
                        onClick={() => setKickTarget(member)}
                        className="shrink-0 rounded px-1 py-0.5 text-xs leading-none font-bold text-stone-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsQuitOpen(true)}
            className="mt-1 rounded-sm border border-red-400 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            {t('guild.quit_cta')}
          </button>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-stone-600">
          <GuildBrowser currentUserId={profile?.id} profile={profile} onGuildChanged={handleGuildChanged} />
          <p className="text-xs text-stone-500">{t('guild.preview_hint')}</p>
        </div>
      )}

      {previewUserId ? (
        <UserPreviewPopup
          userId={previewUserId}
          currentUserId={currentUserId}
          onClose={() => setPreviewUserId(null)}
        />
      ) : null}

      {/* Quit popup */}
      {isQuitOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-sm border border-amber-800/20 bg-[#fffdf8] p-4 shadow-xl">
            <h4 className="mb-2 font-serif text-lg font-bold text-amber-900">{t('guild.quit_confirm_title')}</h4>
            <p className="mb-4 text-sm text-stone-600">{t('guild.quit_confirm_text', { guildName: guildName ?? '' })}</p>
            {quitError ? <p className="mb-2 text-sm text-red-600">{quitError}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setIsQuitOpen(false); setQuitError(null); }} className="rounded-sm border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-600">{t('guild.cancel')}</button>
              <button type="button" onClick={() => { void handleQuit(); }} disabled={isQuitting} className="rounded-sm bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-stone-300">{isQuitting ? '…' : t('guild.quit_confirm')}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Kick popup */}
      {kickTarget ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-sm border border-amber-800/20 bg-[#fffdf8] p-4 shadow-xl">
            <h4 className="mb-2 font-serif text-lg font-bold text-amber-900">{t('guild.kick_confirm_title')}</h4>
            <p className="mb-4 text-sm text-stone-600">{t('guild.kick_confirm_text', { nickname: kickTarget.nickname ?? '' })}</p>
            {kickError ? <p className="mb-2 text-sm text-red-600">{kickError}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setKickTarget(null); setKickError(null); }} className="rounded-sm border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-600">{t('guild.cancel')}</button>
              <button type="button" onClick={() => { void handleKick(); }} disabled={isKicking} className="rounded-sm bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-stone-300">{isKicking ? '…' : t('guild.kick_confirm')}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Assign role – demote picker popup */}
      {assignTarget ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-sm border border-amber-800/20 bg-[#fffdf8] p-4 shadow-xl">
            <h4 className="mb-1 font-serif text-lg font-bold text-amber-900">{t('guild.assign_demote_title')}</h4>
            <p className="mb-3 text-xs text-stone-500">
              {assignTarget.role === 'royal_knight' ? t('guild.assign_knight_cta') : t('guild.assign_wizard_cta')} → {assignTarget.member.nickname}
            </p>
            <div className="mb-4 space-y-2">
              {assignHolders.map((holder) => (
                <button
                  key={holder.id}
                  type="button"
                  disabled={isAssigning}
                  onClick={() => { void handleAssignRole(assignTarget.member.user_id, assignTarget.role, holder.id); }}
                  className="flex w-full items-center gap-2 rounded-sm border border-amber-800/10 bg-amber-50/60 px-3 py-2 text-left hover:bg-amber-100 disabled:cursor-not-allowed"
                >
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-amber-800/20 bg-amber-100">
                    {holder.profile_badge_index != null ? (
                      <Image src={getBadgeImagePath(holder.profile_badge_index)} alt="" width={24} height={24} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-amber-800">{(holder.nickname ?? '?').slice(0, 1).toUpperCase()}</div>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-amber-900">{holder.nickname}</span>
                  <span className="text-xs text-stone-500">{t('guild.demote_cta')}</span>
                </button>
              ))}
            </div>
            {assignError ? <p className="mb-2 text-sm text-red-600">{assignError}</p> : null}
            <div className="flex justify-end">
              <button type="button" onClick={() => { setAssignTarget(null); setAssignError(null); }} className="rounded-sm border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-600">{t('guild.cancel')}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pending requests popup */}
      {isPendingOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-sm border border-amber-800/20 bg-[#fffdf8] p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold text-amber-900">{t('guild.pending_requests')}</h4>
              <button type="button" onClick={() => setIsPendingOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            {isPendingLoading ? (
              <p className="text-sm text-stone-500">{t('social.loading')}</p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-stone-500">{t('guild.no_requests')}</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-2 rounded-sm border border-amber-800/10 bg-amber-50/60 px-2 py-2">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-amber-800/20 bg-amber-100">
                      {req.profile_badge_index != null ? (
                        <Image src={getBadgeImagePath(req.profile_badge_index)} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-amber-800">{(req.nickname ?? '?').slice(0, 1).toUpperCase()}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-amber-900">{req.nickname}</p>
                      {req.level != null ? <p className="text-xs text-stone-500">{t('user.level', { n: req.level })}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        disabled={respondingId === req.id}
                        onClick={() => { void handleRespond(req.id, true); }}
                        className="rounded-sm bg-amber-700 px-2 py-1 text-xs font-semibold text-amber-50 disabled:bg-stone-300"
                      >
                        {t('guild.accept')}
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === req.id}
                        onClick={() => { void handleRespond(req.id, false); }}
                        className="rounded-sm border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 disabled:text-stone-300"
                      >
                        {t('guild.decline')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
