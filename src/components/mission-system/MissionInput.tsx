'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';
import type { EvaluationResult } from '@/types';

const MAX_CHARS = 500;
const MIN_CHARS = 10;

interface MissionInputProps {
  missionId?: string;
  onResult?: (result: EvaluationResult) => void;
}

export function MissionInput({ missionId, onResult }: MissionInputProps) {
  const { t } = useI18n();
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
        <p className="text-xs text-slate-700 uppercase tracking-widest font-semibold">{t('mission.your_prompt')}</p>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Craft your prompt here, adventurer..."
            rows={5}
            className="w-full min-h-[120px] rounded-sm border-2 bg-[#faf7f0] text-stone-800 placeholder-stone-400 border-amber-300/60 p-3 sm:p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all duration-200"
          />
          {/* Char counter */}
          <span className={`absolute bottom-3 right-3 text-xs ${charCount > MAX_CHARS * 0.9 ? 'text-amber-500' : 'text-stone-400'}`}>
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
                ? 'text-red-600'
                : trimmedLen < 50
                  ? 'text-amber-700'
                  : trimmedLen < 150
                    ? 'text-amber-700'
                    : 'text-emerald-700'
            }`}
          >
            {trimmedLen <= 10
              ? t('mission.prompt_too_short')
              : trimmedLen < 50
                ? t('mission.add_context')
                : trimmedLen < 150
                  ? t('mission.good_length')
                  : t('mission.detailed')}
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
          className="block w-3/4 mx-auto min-h-[38px] rounded-sm bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-semibold text-xs sm:text-sm border border-amber-600 shadow-[1px_2px_4px_rgba(101,67,33,0.3)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-4 h-4 border-2 border-amber-200/30 border-t-amber-100 rounded-full"
              />
              {t('mission.evaluating')}
            </span>
          ) : (
            t('mission.submit')
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
