'use client';

import { useEffect, useState } from 'react';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import type { Mission } from '@/types';

interface MissionCardProps {
  onAccept?: (mission: Mission) => void;
}

export function MissionCard({ onAccept }: MissionCardProps) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/mission')
      .then((r) => r.json())
      .then((data: { mission: Mission }) => setMission(data.mission))
      .catch(() => setError('Failed to load mission'))
      .finally(() => setLoading(false));
  }, []);

  function handleAccept() {
    setAccepted(true);
    if (mission && onAccept) onAccept(mission);
  }

  if (loading) return <div className="text-gold animate-pulse text-center py-8">Loading mission...</div>;
  if (error || !mission) return <div className="text-red-400 text-center py-8">{error ?? 'No mission found'}</div>;

  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl border border-gold/30 bg-white/5 dark:bg-night-blue-light/40 backdrop-blur-sm p-6 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-gold font-semibold">{mission.category}</span>
        <StarRating value={mission.difficulty} max={5} />
      </div>
      <h2 className="text-xl font-bold text-mystic-purple dark:text-gold mb-3">{mission.title}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{mission.narrativeDescription}</p>
      <div className="rounded-lg bg-gold/10 dark:bg-mystic-purple/10 border border-gold/20 p-3 mb-4">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{mission.task}</p>
      </div>
      {!accepted && (
        <Button onClick={handleAccept} variant="primary" className="w-full">
          Accetta Missione
        </Button>
      )}
      {accepted && (
        <div className="text-center text-forest-green font-semibold text-sm">Mission accepted. Craft your prompt below.</div>
      )}
    </div>
  );
}
