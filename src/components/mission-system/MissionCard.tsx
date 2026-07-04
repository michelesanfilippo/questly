'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import type { Mission } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'prompt-basics':      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'context-crafting':   'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'chain-of-thought':   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'role-prompting':     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'few-shot':           'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'output-formatting':  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'multimodal':         'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'agents':             'bg-red-500/20 text-red-300 border-red-500/30',
};

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

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-6 w-3/4 bg-white/10 rounded" />
        <div className="h-16 w-full bg-white/10 rounded" />
        <div className="h-10 w-full bg-white/10 rounded-xl" />
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400 text-sm text-center">
        {error ?? 'No mission found'}
      </div>
    );
  }

  const badgeClass = CATEGORY_COLORS[mission.category] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full rounded-2xl border border-white/10 bg-slate-800/60 backdrop-blur-sm p-5 sm:p-6 shadow-xl space-y-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border ${badgeClass}`}>
          {mission.category.replaceAll('-', ' ')}
        </span>
        <StarRating value={mission.difficulty} max={5} />
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-bold text-amber-300 leading-snug">
        {mission.title}
      </h2>

      {/* Narrative */}
      <p className="text-sm text-slate-400 italic leading-relaxed">
        {mission.narrativeDescription}
      </p>

      {/* Task box */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
        <p className="text-sm text-slate-200 leading-relaxed">{mission.task}</p>
      </div>

      {/* Hints */}
      {mission.hints && mission.hints.length > 0 && (
        <details className="group">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors select-none">
            Show hints ({mission.hints.length})
          </summary>
          <ul className="mt-2 space-y-1 pl-3 border-l border-white/10">
            {mission.hints.map((h, i) => (
              <li key={i} className="text-xs text-slate-400 break-words">— {h}</li>
            ))}
          </ul>
        </details>
      )}

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!accepted ? (
          <motion.div key="btn" exit={{ opacity: 0, scale: 0.95 }}>
            <Button onClick={handleAccept} variant="primary" className="w-full min-h-[44px] text-sm sm:text-base">
              Accept Mission
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm py-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Mission Accepted — Craft your prompt below
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
