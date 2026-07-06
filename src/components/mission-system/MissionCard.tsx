'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarRating } from '@/components/ui/StarRating';
import { useI18n } from '@/i18n';
import { useQuestTranslation } from '@/hooks/useQuestTranslation';
import type { Mission } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'prompt-basics':      'bg-blue-100/80 text-blue-800 border-blue-300',
  'context-crafting':   'bg-purple-100/80 text-purple-800 border-purple-300',
  'chain-of-thought':   'bg-amber-100/80 text-amber-900 border-amber-400',
  'role-prompting':     'bg-emerald-100/80 text-emerald-800 border-emerald-300',
  'few-shot':           'bg-rose-100/80 text-rose-800 border-rose-300',
  'output-formatting':  'bg-teal-100/80 text-teal-800 border-teal-300',
  'multimodal':         'bg-orange-100/80 text-orange-800 border-orange-300',
  'agents':             'bg-red-100/80 text-red-800 border-red-300',
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
  const { t, locale } = useI18n();
  const [mission, setMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { translated, translating } = useQuestTranslation(mission, locale);

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
      <div className="w-full rounded-sm border-2 border-amber-800/20 bg-[#faf7f0] p-6 space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-amber-200/50 rounded" />
        <div className="h-6 w-3/4 bg-amber-200/50 rounded" />
        <div className="h-16 w-full bg-amber-200/50 rounded" />
        <div className="h-10 w-full bg-amber-200/50 rounded-xl" />
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
      className="w-full rounded-sm border-2 border-amber-800/30 bg-[#faf7f0] p-5 sm:p-6 shadow-[2px_4px_12px_rgba(101,67,33,0.15)] space-y-4 relative"
    >
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-700/40 rounded-tl-sm" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-700/40 rounded-br-sm" />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border ${badgeClass}`}>
          {mission.category.replaceAll('-', ' ')}
        </span>
        <StarRating value={mission.difficulty} max={5} />
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-bold text-amber-900 leading-snug font-serif">
        {getQuestEmoji(mission)} {translated?.title ?? mission.title}
      </h2>

      {/* Narrative + Task — hidden while translating, replaced by wizard animation */}
      {translating ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <motion.div
            animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-4xl select-none"
          >
            🧙
          </motion.div>
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-xs text-amber-700/70 font-serif italic"
          >
            The wizards are at work...
          </motion.p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-600 italic leading-relaxed">
            {translated?.narrativeDescription ?? mission.narrativeDescription}
          </p>
          <div className="rounded-sm bg-amber-50/80 border border-amber-200/60 p-3 sm:p-4">
            <p className="text-sm text-stone-700 leading-relaxed">
              {translated?.task ?? mission.task}
            </p>
          </div>
        </>
      )}

      {/* Hints + multilingual tip */}
      <div className="flex items-start justify-between gap-2">
        {mission.hints && mission.hints.length > 0 ? (
          <details className="group flex-1">
            <summary className="text-xs text-amber-800/70 cursor-pointer hover:text-amber-900 transition-colors select-none">
              {t('mission.show_hints')} ({mission.hints.length})
            </summary>
          <ul className="mt-2 space-y-1 pl-3 border-l border-amber-300/50">
            {(translated?.hints ?? mission.hints).map((h, i) => (
              <li key={i} className="text-xs text-stone-600 break-words">— {h}</li>
            ))}
          </ul>
        </details>
        ) : <div className="flex-1" />}
        <span className="hidden sm:inline text-[11px] text-amber-800/60 hover:text-amber-900 transition-colors select-none text-right shrink-0 leading-tight">
          🧙 {t('mission.write_language')}
        </span>
        <span className="sm:hidden text-[11px] text-amber-800/60 select-none shrink-0">
          🧙
        </span>
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!accepted ? (
          <motion.div key="btn" exit={{ opacity: 0, scale: 0.95 }}>
            <button
              onClick={disabled ? undefined : handleAccept}
              disabled={disabled}
              className={`block w-3/4 mx-auto min-h-[38px] rounded-sm font-semibold text-xs sm:text-sm border transition-all duration-150 ${
                disabled
                  ? 'bg-stone-300 text-stone-400 border-stone-300 cursor-not-allowed opacity-60'
                  : 'bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)]'
              }`}
            >
              {t('mission.accept')}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm py-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t('mission.accepted')}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
