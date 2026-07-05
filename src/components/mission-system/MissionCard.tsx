'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarRating } from '@/components/ui/StarRating';
import type { Mission } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'prompt-basics':      'bg-blue-100/80 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  'context-crafting':   'bg-purple-100/80 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
  'chain-of-thought':   'bg-amber-100/80 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:text-amber-300 dark:border-indigo-400/30',
  'role-prompting':     'bg-emerald-100/80 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  'few-shot':           'bg-rose-100/80 text-rose-800 border-rose-300 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
  'output-formatting':  'bg-teal-100/80 text-teal-800 border-teal-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
  'multimodal':         'bg-orange-100/80 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  'agents':             'bg-red-100/80 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
};

function getQuestEmoji(mission: Mission): string {
  const text = (mission.title + ' ' + mission.narrativeDescription).toLowerCase();
  if (/smith|forge|blacksmith|fabb|sword|weapon|armor/.test(text)) return '⚔️';
  if (/wizard|mage|mago|spell|arcane|sorcerer|magic/.test(text)) return '🧙';
  if (/king|queen|crown|royal|throne|court|sovereign/.test(text)) return '👑';
  if (/dragon/.test(text)) return '🐉';
  if (/scroll|library|book|archive|manuscript|bibliote/.test(text)) return '📜';
  if (/oracle|prophet|vision|prophecy/.test(text)) return '🔮';
  if (/knight|warrior|battle|combat|shield/.test(text)) return '🛡️';
  if (/alchemist|potion|brew|cauldron/.test(text)) return '⚗️';
  if (/merchant|trade|market|bazaar|shop/.test(text)) return '🏪';
  if (/map|cartograph|navigate|journey|quest/.test(text)) return '🗺️';
  if (/star|astral|celestial|cosmic|constellation/.test(text)) return '✨';
  if (/time|clock|temporal|chrono/.test(text)) return '⏳';
  if (/mind|mental|thought|psychic|brain/.test(text)) return '🧠';
  if (/shadow|dark|night|void|phantom/.test(text)) return '🌑';
  if (/spirit|soul|ghost|specter/.test(text)) return '👻';
  if (/nature|forest|tree|grove|druid/.test(text)) return '🌿';
  if (/ocean|sea|water|tide|reef/.test(text)) return '🌊';
  if (/fire|flame|ember|volcano/.test(text)) return '🔥';
  if (/sage|wise|elder|master|legend/.test(text)) return '🏛️';
  return '⚡';
}

interface MissionCardProps {
  onAccept?: (mission: Mission) => void;
  disabled?: boolean;
}

export function MissionCard({ onAccept, disabled = false }: MissionCardProps) {
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
      <div className="w-full rounded-sm border-2 border-amber-800/20 bg-[#faf7f0] dark:border-indigo-500/20 dark:bg-indigo-900/30 p-6 space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-amber-200/50 dark:bg-indigo-800/40 rounded" />
        <div className="h-6 w-3/4 bg-amber-200/50 dark:bg-indigo-800/40 rounded" />
        <div className="h-16 w-full bg-amber-200/50 dark:bg-indigo-800/40 rounded" />
        <div className="h-10 w-full bg-amber-200/50 dark:bg-indigo-800/40 rounded-xl" />
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
      className="w-full rounded-sm border-2 border-amber-800/30 dark:border-indigo-500/30 bg-[#faf7f0] dark:bg-slate-900/80 p-5 sm:p-6 shadow-[2px_4px_12px_rgba(101,67,33,0.15)] dark:shadow-xl space-y-4 relative"
    >
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-700/40 dark:border-indigo-400/30 rounded-tl-sm" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-700/40 dark:border-indigo-400/30 rounded-br-sm" />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border ${badgeClass}`}>
          {mission.category.replaceAll('-', ' ')}
        </span>
        <StarRating value={mission.difficulty} max={5} />
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-bold text-amber-900 dark:text-indigo-100 leading-snug font-serif">
        {getQuestEmoji(mission)} {mission.title}
      </h2>

      {/* Narrative */}
      <p className="text-sm text-stone-600 dark:text-indigo-200/80 italic leading-relaxed">
        {mission.narrativeDescription}
      </p>

      {/* Task box */}
      <div className="rounded-sm bg-amber-50/80 dark:bg-indigo-900/30 border border-amber-200/60 dark:border-indigo-500/20 p-3 sm:p-4">
        <p className="text-sm text-stone-700 dark:text-indigo-100 leading-relaxed">{mission.task}</p>
      </div>

      {/* Hints */}
      {mission.hints && mission.hints.length > 0 && (
        <details className="group">
          <summary className="text-xs text-amber-800/70 dark:text-indigo-300/60 cursor-pointer hover:text-amber-900 dark:hover:text-indigo-200 transition-colors select-none">
            Show hints ({mission.hints.length})
          </summary>
          <ul className="mt-2 space-y-1 pl-3 border-l border-amber-300/50 dark:border-indigo-500/20">
            {mission.hints.map((h, i) => (
              <li key={i} className="text-xs text-stone-600 dark:text-indigo-200/70 break-words">— {h}</li>
            ))}
          </ul>
        </details>
      )}

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!accepted ? (
          <motion.div key="btn" exit={{ opacity: 0, scale: 0.95 }}>
            <button
              onClick={disabled ? undefined : handleAccept}
              disabled={disabled}
              className={`block w-3/4 mx-auto min-h-[38px] rounded-sm font-semibold text-xs sm:text-sm border transition-all duration-150 ${
                disabled
                  ? 'bg-stone-300 dark:bg-slate-700 text-stone-400 dark:text-slate-500 border-stone-300 dark:border-slate-600 cursor-not-allowed opacity-60'
                  : 'bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)]'
              }`}
            >
              Accept Mission
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm py-2"
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
