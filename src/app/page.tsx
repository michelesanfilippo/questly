'use client';

import { useEffect, useState } from 'react';
import { VillageScene } from '@/components/fantasy-world/VillageScene';
import { MissionCard } from '@/components/mission-system/MissionCard';
import { MissionInput } from '@/components/mission-system/MissionInput';
import { EvaluationResult } from '@/components/mission-system/EvaluationResult';
import { NicknameSetup } from '@/components/auth/NicknameSetup';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { TrophyNotification } from '@/components/ui/TrophyNotification';
import { getProfile, saveProfile } from '@/lib/auth';
import { addXP, updateStreak, checkTrophies, getTrophyDefinitions } from '@/lib/progression';
import type { Mission, EvaluationResult as EvalResultType, UserProfile } from '@/types';

export default function HomePage() {
  // --- existing state ---
  const [mission, setMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [evaluation, setEvaluation] = useState<EvalResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- gamification state ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [trophyQueue, setTrophyQueue] = useState<string[]>([]);
  const [currentTrophy, setCurrentTrophy] = useState<string | null>(null);

  // --- on mount: load profile + fetch mission ---
  useEffect(() => {
    const stored = getProfile();
    if (stored === null) {
      setShowNicknameSetup(true);
    } else {
      const updated = updateStreak(stored);
      saveProfile(updated);
      setProfile(updated);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchMission() {
      try {
        const res = await fetch('/api/mission');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { mission: Mission };
        if (!cancelled) setMission(data.mission);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load mission');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMission();
    return () => { cancelled = true; };
  }, []);

  // --- process evaluation: XP, trophies, persist ---
  useEffect(() => {
    if (!evaluation || !profile) return;

    const updated = addXP({ ...profile }, evaluation.xpAwarded);
    updated.completedMissions = [...updated.completedMissions, evaluation.missionId];

    const defs = getTrophyDefinitions();
    const newTrophyIds = checkTrophies(updated, evaluation);
    updated.trophies = [...updated.trophies, ...newTrophyIds];

    saveProfile(updated);
    setProfile(updated);

    if (newTrophyIds.length > 0) {
      // Map IDs to display names via definitions
      const idToName = new Map(defs.map(d => [d.id, d.name]));
      const names = newTrophyIds.map(id => idToName.get(id) ?? id);
      setTrophyQueue(prev => [...prev, ...names]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation]);

  // --- drain trophy queue into currentTrophy ---
  useEffect(() => {
    if (currentTrophy === null && trophyQueue.length > 0) {
      setCurrentTrophy(trophyQueue[0]);
      setTrophyQueue(prev => prev.slice(1));
    }
  }, [trophyQueue, currentTrophy]);

  // --- handlers ---
  function handleAccept(m: Mission) {
    setMission(m);
    setAccepted(true);
  }

  function handleNicknameComplete(newProfile: UserProfile) {
    setProfile(newProfile);
    setShowNicknameSetup(false);
  }

  function handleTrophyDismiss() {
    setCurrentTrophy(null);
  }

  return (
    <>
      {/* Auth modal — first launch only */}
      {showNicknameSetup && (
        <NicknameSetup onComplete={handleNicknameComplete} />
      )}

      {/* Trophy toast — controlled by queue */}
      {currentTrophy !== null && (
        <TrophyNotification
          trophyName={currentTrophy}
          onDismiss={handleTrophyDismiss}
        />
      )}

      <main className="flex flex-col h-screen overflow-hidden">
        {/* TOP — Fantasy Village */}
        <section className="relative h-[40vh] sm:h-1/2 flex-shrink-0 overflow-hidden">
          <VillageScene />
        </section>

        {/* PROFILE HEADER — visible after nickname setup */}
        {profile !== null && (
          <div className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3">
            <div className="max-w-2xl mx-auto">
              <ProfileHeader profile={profile} />
            </div>
          </div>
        )}

        {/* BOTTOM — Mission System (scrollable) */}
        <section className="flex-1 overflow-y-auto bg-slate-900 dark:bg-slate-950">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
            {loading && (
              <p className="text-amber-400 animate-pulse text-sm text-center mt-8">
                Loading your daily mission...
              </p>
            )}
            {error && !loading && (
              <p className="text-red-400 text-sm text-center mt-8">{error}</p>
            )}
            {!loading && (
              <>
                <MissionCard onAccept={handleAccept} />
                {accepted && !evaluation && mission && (
                  <MissionInput missionId={mission.id} onResult={setEvaluation} />
                )}
                {evaluation && (
                  <EvaluationResult result={evaluation} />
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
