'use client';

import { useEffect, useState } from 'react';
import { VillageScene } from '@/components/fantasy-world/VillageScene';
import { MissionCard } from '@/components/mission-system/MissionCard';
import { MissionInput } from '@/components/mission-system/MissionInput';
import { EvaluationResult } from '@/components/mission-system/EvaluationResult';
import type { Mission, EvaluationResult as EvalResultType } from '@/types';

export default function HomePage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [evaluation, setEvaluation] = useState<EvalResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  function handleAccept(m: Mission) {
    setMission(m);
    setAccepted(true);
  }

  return (
    <main className="flex flex-col min-h-[100dvh]">
      <section className="relative h-[40vh] sm:h-[45vh] lg:h-[50vh] flex-shrink-0 overflow-hidden w-full">
        <VillageScene />
      </section>
      <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-4">
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
  );
}
