'use client';

import { motion } from 'framer-motion';
import type { EvaluationResult as EvalResultType } from '@/types';

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
        <span className="text-slate-500 dark:text-indigo-200/70">{label}</span>
        <span className="font-semibold text-slate-700 dark:text-indigo-100">{value}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-indigo-900/60 rounded-full overflow-hidden">
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

export function EvaluationResult({ result }: Props) {
  if (!result) return null;

  const { scores, feedback, suggestions, xpAwarded, source } = result;
  const total = scores.total;
  const totalColor = total >= 80 ? 'text-emerald-600 dark:text-emerald-400' : total >= 60 ? 'text-amber-600 dark:text-amber-400' : total >= 40 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full rounded-2xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-900/80 backdrop-blur-sm p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-slate-900 dark:text-indigo-100 text-base sm:text-lg">Evaluation Results</h3>
        <span className="text-amber-700 dark:text-amber-300 font-bold text-sm bg-amber-100 dark:bg-amber-300/10 border border-amber-300 dark:border-amber-300/20 px-3 py-1 rounded-full">
          +{xpAwarded} XP
        </span>
      </motion.div>

      {/* Total score */}
      <motion.div variants={itemVariants} className="flex flex-col items-center gap-1 py-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl sm:text-5xl font-bold ${totalColor}`}>{total}</span>
          <span className="text-slate-600 dark:text-slate-500 text-lg">/ 100</span>
        </div>
        <span className="text-xs text-stone-400 dark:text-indigo-400/50">
          {source === 'ai' ? 'AI evaluated' : 'heuristic evaluated'}
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
        className="border-l-2 border-amber-500/50 dark:border-indigo-400/40 pl-4 text-sm text-slate-600 dark:text-indigo-200 italic leading-relaxed"
      >
        {feedback}
      </motion.blockquote>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-indigo-300/60">
            Suggestions to improve
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-600 dark:text-indigo-200/80">
                <span className="text-amber-500 dark:text-indigo-400 flex-shrink-0">→</span>
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
