'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import type { EvaluationResult } from '@/types';

const MAX_CHARS = 500;
const MIN_CHARS = 10;

interface MissionInputProps {
  missionId?: string;
  onResult?: (result: EvaluationResult) => void;
}

export function MissionInput({ missionId, onResult }: MissionInputProps) {
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!missionId) return null;

  const charCount = prompt.length;
  const trimmedLen = prompt.trim().length;
  const isValid = trimmedLen > MIN_CHARS && charCount <= MAX_CHARS;

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, userPrompt: prompt }),
      });
      const data = await res.json() as { result: EvaluationResult };
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Evaluation failed');
      if (onResult) onResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full space-y-3"
      >
        <p className="text-xs text-slate-700 dark:text-slate-400 uppercase tracking-widest font-semibold">Your Prompt</p>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Craft your prompt here, adventurer..."
            rows={5}
            className="
              w-full min-h-[120px] rounded-xl border
              bg-white dark:bg-slate-800/80
              text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              border-slate-200 dark:border-white/10
              p-3 sm:p-4 text-sm resize-y
              focus:outline-none focus:ring-2 focus:ring-amber-500/50
              focus:border-amber-400 dark:focus:border-amber-500/40
              transition-all duration-200
            "
          />
          {/* Char counter */}
          <span className={`absolute bottom-3 right-3 text-xs ${charCount > MAX_CHARS * 0.9 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-600'}`}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        {/* Inline validation hints */}
        {trimmedLen > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs font-medium ${
              trimmedLen <= 10
                ? 'text-red-600 dark:text-red-400'
                : trimmedLen < 50
                  ? 'text-amber-700 dark:text-amber-400'
                  : trimmedLen < 150
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {trimmedLen <= 10
              ? 'Prompt too short — write at least 10 characters'
              : trimmedLen < 50
                ? 'Add more context or structure to improve your score'
                : trimmedLen < 150
                  ? 'Good length — try adding role, format, or constraints'
                  : 'Detailed prompt — ready to submit'}
          </motion.p>
        )}

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-xs"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          variant="primary"
          className="w-full min-h-[44px] text-sm sm:text-base"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Evaluating...
            </span>
          ) : (
            'Submit Prompt'
          )}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
