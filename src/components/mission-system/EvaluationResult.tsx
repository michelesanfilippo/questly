'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
import type { EvaluationResult as EvalResultType, CoachingEntry } from '@/types';

interface Props {
  result?: EvalResultType | null;
}

const SCORE_LABELS: Record<string, string> = {
  creativity: 'Creativity',
  precision: 'Precision',
  context: 'Context',
  structure: 'Structure',
  promptEngineering: 'Prompt Engineering',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-400' : value >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{value}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const DIMENSION_ICON: Record<string, string> = {
  creativity: '✦',
  precision: '◎',
  context: '◈',
  structure: '⊞',
  promptEngineering: '⚡',
};

function CoachingSection({ coaching, total, t }: { coaching: CoachingEntry[]; total: number; t: (k: string, v?: Record<string, string | number>) => string }) {
  if (total >= 80) {
    return (
      <motion.div variants={itemVariants} className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
        {t('coaching.strong')}
      </motion.div>
    );
  }
  if (coaching.length === 0) return null;
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('coaching.title')}</p>
      <ul className="space-y-3">
        {coaching.map((c, i) => (
          <li key={i} className={`rounded-lg border px-4 py-3 space-y-1 ${i === 0 ? 'border-red-200 bg-red-50' : 'border-amber-100 bg-amber-50/60'}`}>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <span>{DIMENSION_ICON[c.dimension] ?? '→'}</span>
              <span>{t(`coaching.dimension.${c.dimension}`)}</span>
            </div>
            <p className="text-xs text-slate-700">{c.tip}</p>
            <code className="block text-xs text-slate-500 bg-white/70 rounded px-2 py-1 leading-relaxed">{c.example}</code>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function EvaluationResult({ result }: Props) {
  const { t } = useI18n();
  if (!result) return null;

  const { scores, feedback, suggestions, coaching, xpAwarded, source } = result;
  const total = scores.total;
  const totalColor = total >= 80 ? 'text-emerald-600' : total >= 60 ? 'text-amber-600' : total >= 40 ? 'text-orange-600' : 'text-red-600';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full rounded-2xl border border-slate-200 bg-white backdrop-blur-sm p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg">{t('evaluation.title')}</h3>
        <span className="text-amber-700 font-bold text-sm bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
          {t('evaluation.xp', { xp: xpAwarded })}
        </span>
      </motion.div>

      {/* Total score */}
      <motion.div variants={itemVariants} className="flex flex-col items-center gap-1 py-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl sm:text-5xl font-bold ${totalColor}`}>{total}</span>
          <span className="text-slate-600 text-lg">/ 100</span>
        </div>
        <span className="text-xs text-stone-400">
          {source === 'ai' ? t('evaluation.ai_evaluated') : t('evaluation.heuristic_evaluated')}
        </span>
      </motion.div>

      {/* Score bars */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(SCORE_LABELS).map(([key, label]) => (
          <ScoreBar key={key} label={label} value={scores[key as keyof typeof scores] as number} />
        ))}
      </motion.div>

      {/* Feedback */}
      <motion.blockquote
        variants={itemVariants}
        className="border-l-2 border-amber-500/50 pl-4 text-sm text-slate-600 italic leading-relaxed"
      >
        {feedback}
      </motion.blockquote>

      {/* Coaching */}
      {coaching && <CoachingSection coaching={coaching} total={scores.total} t={t} />}

      {/* Suggestions — shown only when coaching is absent or score is mid-range */}
      {suggestions.length > 0 && !coaching?.length && (
        <motion.div variants={itemVariants} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('evaluation.suggestions')}
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-600">
                <span className="text-amber-500 flex-shrink-0">→</span>
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
