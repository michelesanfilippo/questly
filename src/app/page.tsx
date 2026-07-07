'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { VillageScene } from '@/components/fantasy-world/VillageScene';
import { MissionCard } from '@/components/mission-system/MissionCard';
import { MissionInput } from '@/components/mission-system/MissionInput';
import { EvaluationResult } from '@/components/mission-system/EvaluationResult';
import { supabase } from '@/lib/supabase';
import { getProfile, getUserBadges, updateProfileXP, awardBadge, getNpcProgress, incrementNpcProgress, updateLoginStreak } from '@/lib/supabaseAuth';
import { checkNewBadges, addXPToProfile } from '@/lib/badges';
import type { NpcProgress } from '@/types';
import { LoginModal } from '@/components/auth/LoginModal';
import { RegisterModal } from '@/components/auth/RegisterModal';
import { NicknameSetup } from '@/components/auth/NicknameSetup';
import { UserCard } from '@/components/profile/UserCard';
import { LoginInviteCard } from '@/components/profile/LoginInviteCard';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { FriendsCard } from '@/components/social/FriendsCard';
import { GuildPanel } from '@/components/guild/GuildPanel';
import { BadgeUnlockPopup } from '@/components/ui/BadgeUnlockPopup';
import { BADGE_DEFINITIONS, getBadgeImagePath } from '@/lib/badges';
import type { Mission, EvaluationResult as EvalResultType } from '@/types';
import type { SupabaseProfile } from '@/types';
import type { Session } from '@supabase/supabase-js';

export default function HomePage() {
  const { t } = useI18n();
  const [mission, setMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [evaluation, setEvaluation] = useState<EvalResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<number[]>([]);
  const [npcProgress, setNpcProgress] = useState<NpcProgress[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [missionAlreadyDone, setMissionAlreadyDone] = useState(false);
  const [badgePopupQueue, setBadgePopupQueue] = useState<number[]>([]);
  const [currentBadgePopup, setCurrentBadgePopup] = useState<number | null>(null);

  // Mission fetch
  useEffect(() => {
    let cancelled = false;
    async function fetchMission() {
      try {
        const res = await fetch('/api/mission');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { mission: Mission };
        if (!cancelled) {
          setMission(data.mission);
          // Check if logged-in user already completed today's mission
          setProfile(prev => {
            if (prev && data.mission) {
              const today = (() => { const _d = new Date(); return `${_d.getUTCFullYear()}-${String(_d.getUTCMonth()+1).padStart(2,'0')}-${String(_d.getUTCDate()).padStart(2,'0')}`; })();
              if (prev.last_mission_id === data.mission.id && prev.last_mission_date === today) {
                setMissionAlreadyDone(true);
              }
            }
            return prev;
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load mission');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMission();
    return () => { cancelled = true; };
  }, []);

  // Auth state
  useEffect(() => {
    // Loads all user data. Must run OUTSIDE the onAuthStateChange callback:
    // that callback holds Supabase's internal auth lock (navigator LockManager),
    // and awaiting other Supabase queries inside it can deadlock — leaving the
    // profile null (features locked) until a manual page reload frees the lock.
    async function loadUserData(session: Session) {
      if (!session.user) return;
      const { data: prof } = await getProfile(session.user.id);
      if (prof) {
        setProfile(prof);
        // Check if today's mission already completed
        setMission(prev => {
          if (prev) {
            const today = (() => { const _d = new Date(); return `${_d.getUTCFullYear()}-${String(_d.getUTCMonth()+1).padStart(2,'0')}-${String(_d.getUTCDate()).padStart(2,'0')}`; })();
            if (prof.last_mission_id === prev.id && prof.last_mission_date === today) {
              setMissionAlreadyDone(true);
            }
          }
          return prev;
        });
        const { data: badges } = await getUserBadges(session.user.id);
        setEarnedBadges(badges?.map((b: { badge_index: number }) => b.badge_index) ?? []);
        const { data: npc } = await getNpcProgress(session.user.id);
        setNpcProgress((npc as NpcProgress[]) ?? []);
        // Update login streak on every login/session restore
        await updateLoginStreak(session.user.id);
      } else {
        setShowNicknameSetup(true);
      }
    }

    // Keep the callback synchronous and defer all Supabase calls to a macrotask,
    // so the auth lock is released before we query the database.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => { void loadUserData(session); }, 0);
      } else {
        setProfile(null);
        setEarnedBadges([]);
        setNpcProgress([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Custom login event from VillageScene
  useEffect(() => {
    const handler = () => setShowLoginModal(true);
    window.addEventListener('questly:openLogin', handler);
    return () => window.removeEventListener('questly:openLogin', handler);
  }, []);

  // Gamification: process evaluation when it arrives and profile exists
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!evaluation || !profile || !session) return;
    async function processGamification() {
      const { newXP, newLevel } = addXPToProfile(profile!, evaluation!.xpAwarded);
      const newMissions = profile!.missions_completed + 1;
      const today = (() => { const _d = new Date(); return `${_d.getUTCFullYear()}-${String(_d.getUTCMonth()+1).padStart(2,'0')}-${String(_d.getUTCDate()).padStart(2,'0')}`; })();
      const diff = mission?.difficulty ?? 1;
      const diffCounters = {
        missions_diff2plus: (profile!.missions_diff2plus ?? 0) + (diff >= 2 ? 1 : 0),
        missions_diff3plus: (profile!.missions_diff3plus ?? 0) + (diff >= 3 ? 1 : 0),
        missions_diff4plus: (profile!.missions_diff4plus ?? 0) + (diff >= 4 ? 1 : 0),
        missions_diff5:     (profile!.missions_diff5 ?? 0)     + (diff >= 5 ? 1 : 0),
      };
      await updateProfileXP(profile!.id, newXP, newLevel, newMissions, mission?.id, today, diffCounters);
      setMissionAlreadyDone(true);
      // Increment NPC progress with score60 flag
      const npcSource = mission?.npcSource;
      const score60 = (evaluation!.scores.total > 60);
      if (npcSource) await incrementNpcProgress(profile!.id, npcSource, score60);
      // Updated NPC progress for badge check
      const updatedNpc: NpcProgress[] = npcSource
        ? npcProgress.map(p => p.npc_source === npcSource ? {
            ...p,
            quest_count: p.quest_count + 1,
            score60_count: (p.score60_count ?? 0) + (score60 ? 1 : 0),
          } : p)
        : [...npcProgress];
      if (npcSource && !npcProgress.find(p => p.npc_source === npcSource)) {
        updatedNpc.push({ user_id: profile!.id, npc_source: npcSource, quest_count: 1, score60_count: score60 ? 1 : 0, last_updated: today });
      }
      setNpcProgress(updatedNpc);
      // Get updated login streak
      const { login_streak } = await updateLoginStreak(profile!.id);
      const updatedProfileForCheck = { ...profile!, xp: newXP, level: newLevel, missions_completed: newMissions, ...diffCounters, login_streak };
      const newBadges = checkNewBadges(
        updatedProfileForCheck,
        { scores: evaluation!.scores, missionDifficulty: diff, npcProgress: updatedNpc, submittedAt: new Date(), loginStreak: login_streak },
        earnedBadges
      );
      for (const idx of newBadges) {
        await awardBadge(profile!.id, idx);
      }
      const { data: updatedProfile } = await getProfile(profile!.id);
      if (updatedProfile) setProfile(updatedProfile);
      const { data: updatedBadges } = await getUserBadges(profile!.id);
      setEarnedBadges(updatedBadges?.map((b: { badge_index: number }) => b.badge_index) ?? []);
      // Queue badge unlock popups
      if (newBadges.length > 0) {
        setBadgePopupQueue(newBadges);
        setCurrentBadgePopup(newBadges[0]);
      }
    }
    processGamification();
  }, [evaluation]); // intentionally only evaluation

  function dismissBadgePopup() {
    setBadgePopupQueue(prev => {
      const remaining = prev.slice(1);
      setCurrentBadgePopup(remaining.length > 0 ? remaining[0] : null);
      return remaining;
    });
  }

  function handleAccept(m: Mission) {
    setMission(m);
    setAccepted(true);
  }

  const missionFlow = (
    <>
      {loading && (
        <p className="text-amber-600 animate-pulse text-sm text-center mt-8">
          {t('mission.loading')}
        </p>
      )}
      {error && !loading && (
        <p className="text-red-400 text-sm text-center mt-8">{error}</p>
      )}
      {!loading && (
        <>
          <MissionCard onAccept={handleAccept} disabled={missionAlreadyDone} />
          {missionAlreadyDone && !evaluation && (
            <p className="text-center text-base font-medium text-emerald-600 py-2">
              {t('mission.already_done')}
            </p>
          )}
          {accepted && !evaluation && mission && !missionAlreadyDone && (
            <MissionInput missionId={mission.id} onResult={setEvaluation} />
          )}
          {evaluation && <EvaluationResult result={evaluation} />}
        </>
      )}
    </>
  );

  return (
    <>
      {showLoginModal && (
        <LoginModal
          isOpen
          onClose={() => setShowLoginModal(false)}
          onOpenRegister={() => setShowRegisterModal(true)}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          isOpen
          onClose={() => setShowRegisterModal(false)}
          onBackToLogin={() => setShowLoginModal(true)}
        />
      )}
      {currentBadgePopup !== null && profile && (() => {
        const def = BADGE_DEFINITIONS.find(b => b.index === currentBadgePopup);
        return def ? (
          <BadgeUnlockPopup
            nickname={profile.nickname}
            badgeName={def.name}
            badgeDescription={def.description}
            badgeImagePath={getBadgeImagePath(currentBadgePopup)}
            onClose={dismissBadgePopup}
          />
        ) : null;
      })()}
      {showNicknameSetup && session && (
        <NicknameSetup
          userId={session.user.id}
          email={session.user.email ?? null}
          onComplete={(p) => { setProfile(p); setShowNicknameSetup(false); }}
        />
      )}
      <main className="flex flex-col min-h-[100dvh]">
        <section className="relative h-[48vh] flex-shrink-0 overflow-hidden w-full">
          <VillageScene />
        </section>
        <section className="flex-1 overflow-y-auto bg-[#faf7f0]">
          {/* 3-col layout for all users */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4 px-4 sm:px-6 py-6 w-full">
            {/* Leaderboard — visible to all */}
            <div className="order-3 lg:order-1 flex flex-col gap-4">
              <Leaderboard currentUserId={profile?.id} isLoggedIn={!!profile} />
              <GuildPanel profile={profile} onProfileUpdate={(updated) => setProfile(updated)} />
            </div>
            {/* Mission — center */}
            <div className="order-1 lg:order-2 flex flex-col gap-4">
              {missionFlow}
            </div>
            {/* UserCard or login invite */}
            <div className="order-2 lg:order-3">
              {profile ? (
                <div className="flex flex-col gap-4">
                  <UserCard
                    profile={profile}
                    earnedBadges={earnedBadges}
                    onProfileUpdate={(updated) => setProfile(updated)}
                  />
                  <FriendsCard currentUserId={profile.id} profileLevel={profile.level} />
                </div>
              ) : (
                <LoginInviteCard />
              )}
              </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="py-2 px-4 flex justify-center bg-[#faf7f0] border-t border-amber-800/10">
          <a
            href="https://buymeacoffee.com/michelesanc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[8px] sm:text-[10px] text-amber-700/60 hover:text-amber-500 transition-colors"
          >
            ☕
            Enjoying Questly? Support us with a coffee and help us create new magical features
          </a>
        </footer>
      </main>
    </>
  );
}


