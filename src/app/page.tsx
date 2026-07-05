'use client';

import { useEffect, useState } from 'react';
import { VillageScene } from '@/components/fantasy-world/VillageScene';
import { MissionCard } from '@/components/mission-system/MissionCard';
import { MissionInput } from '@/components/mission-system/MissionInput';
import { EvaluationResult } from '@/components/mission-system/EvaluationResult';
import { supabase } from '@/lib/supabase';
import { getProfile, getUserBadges, updateProfileXP, awardBadge } from '@/lib/supabaseAuth';
import { checkNewBadges, addXPToProfile } from '@/lib/badges';
import { LoginModal } from '@/components/auth/LoginModal';
import { NicknameSetup } from '@/components/auth/NicknameSetup';
import { UserCard } from '@/components/profile/UserCard';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import type { Mission, EvaluationResult as EvalResultType } from '@/types';
import type { SupabaseProfile } from '@/types';
import type { Session } from '@supabase/supabase-js';

export default function HomePage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [evaluation, setEvaluation] = useState<EvalResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<number[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [missionAlreadyDone, setMissionAlreadyDone] = useState(false);

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
              const today = new Date().toISOString().split('T')[0];
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: prof } = await getProfile(session.user.id);
        if (prof) {
          setProfile(prof);
          // Check if today's mission already completed
          setMission(prev => {
            if (prev) {
              const today = new Date().toISOString().split('T')[0];
              if (prof.last_mission_id === prev.id && prof.last_mission_date === today) {
                setMissionAlreadyDone(true);
              }
            }
            return prev;
          });
          const { data: badges } = await getUserBadges(session.user.id);
          setEarnedBadges(badges?.map((b: { badge_index: number }) => b.badge_index) ?? []);
        } else {
          setShowNicknameSetup(true);
        }
      } else {
        setProfile(null);
        setEarnedBadges([]);
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
      const today = new Date().toISOString().split('T')[0];
      await updateProfileXP(profile!.id, newXP, newLevel, newMissions, mission?.id, today);
      setMissionAlreadyDone(true);
      const newBadges = checkNewBadges(
        { ...profile!, xp: newXP, level: newLevel, missions_completed: newMissions },
        { scores: evaluation!.scores },
        earnedBadges
      );
      for (const idx of newBadges) {
        await awardBadge(profile!.id, idx);
      }
      const { data: updatedProfile } = await getProfile(profile!.id);
      if (updatedProfile) setProfile(updatedProfile);
      const { data: updatedBadges } = await getUserBadges(profile!.id);
      setEarnedBadges(updatedBadges?.map((b: { badge_index: number }) => b.badge_index) ?? []);
    }
    processGamification();
  }, [evaluation]); // intentionally only evaluation

  function handleAccept(m: Mission) {
    setMission(m);
    setAccepted(true);
  }

  const missionFlow = (
    <>
      {loading && (
        <p className="text-amber-600 dark:text-amber-400 animate-pulse text-sm text-center mt-8">
          Loading your daily mission...
        </p>
      )}
      {error && !loading && (
        <p className="text-red-400 text-sm text-center mt-8">{error}</p>
      )}
      {!loading && (
        <>
          <MissionCard onAccept={handleAccept} disabled={missionAlreadyDone} />
          {missionAlreadyDone && !evaluation && (
            <p className="text-center text-base font-medium text-emerald-600 dark:text-emerald-400 py-2">
              You have already completed today&apos;s mission. Come back tomorrow!
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
        <LoginModal isOpen onClose={() => setShowLoginModal(false)} />
      )}
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
        <section className="flex-1 overflow-y-auto bg-[#faf7f0] dark:bg-[#060b1a]">
          {/* UNAUTHENTICATED: existing centered layout, zero changes */}
          {!profile && (
            <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-4">
              {missionFlow}
            </div>
          )}
          {/* AUTHENTICATED: 3-col layout */}
          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4 px-4 sm:px-6 py-6 w-full">
              <div className="order-3 lg:order-1">
                <Leaderboard currentUserId={profile.id} />
              </div>
              <div className="order-1 lg:order-2 flex flex-col gap-4">
                {missionFlow}
              </div>
              <div className="order-2 lg:order-3">
                <UserCard
                  profile={profile}
                  earnedBadges={earnedBadges}
                  onSignOut={() => { setProfile(null); setEarnedBadges([]); }}
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
