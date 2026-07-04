'use client';

import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import type { EvaluationResult as EvalResultType } from '@/types';

interface EvaluationResultProps {
  result?: EvalResultType | null;
}

export function EvaluationResult({ result }: EvaluationResultProps) {
  if (!result) return null;

  const { scores, feedback, suggestions, xpAwarded } = result;

  return (
    <div className="w-full max-w-lg mx-auto mt-4 rounded-2xl border border-forest-green/30 bg-forest-green/5 dark:bg-night-blue-light/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-forest-green dark:text-forest-green-light text-base">Evaluation Results</h3>
        <span className="text-gold font-bold text-sm">+{xpAwarded} XP</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ScoreDisplay label="Creativity" value={scores.creativity} />
        <ScoreDisplay label="Precision" value={scores.precision} />
        <ScoreDisplay label="Context" value={scores.context} />
        <ScoreDisplay label="Structure" value={scores.structure} />
        <ScoreDisplay label="Prompt Engineering" value={scores.promptEngineering} className="col-span-2" />
      </div>

      <div className="text-center">
        <span className="text-2xl font-bold text-mystic-purple dark:text-gold">{scores.total}</span>
        <span className="text-slate-400 text-sm ml-1">/ 100</span>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 italic">{feedback}</p>

      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Suggestions</p>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                <span className="text-gold">-</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
