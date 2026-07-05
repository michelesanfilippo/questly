'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
            className="w-full min-h-[120px] rounded-sm border-2 bg-[#faf7f0] dark:bg-indigo-950/60 text-stone-800 dark:text-indigo-100 placeholder-stone-400 dark:placeholder-indigo-300/40 border-amber-300/60 dark:border-indigo-500/30 p-3 sm:p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/40 dark:focus:ring-indigo-500/40 focus:border-amber-500 dark:focus:border-indigo-400 transition-all duration-200"
          />
          {/* Char counter */}
          <span className={`absolute bottom-3 right-3 text-xs ${charCount > MAX_CHARS * 0.9 ? 'text-amber-500' : 'text-stone-400 dark:text-indigo-400/50'}`}>
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

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="block w-3/4 mx-auto min-h-[38px] rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 dark:bg-indigo-700 dark:hover:bg-indigo-600 dark:active:bg-indigo-800 text-amber-50 dark:text-indigo-50 font-semibold text-xs sm:text-sm border border-amber-600 dark:border-indigo-500 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] dark:shadow-[1px_2px_8px_rgba(67,56,202,0.3)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-4 h-4 border-2 border-amber-200/30 dark:border-indigo-200/30 border-t-amber-100 dark:border-t-indigo-100 rounded-full"
              />
              Evaluating...
            </span>
          ) : (
            'Submit Prompt'
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
