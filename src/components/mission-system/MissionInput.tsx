'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { EvaluationResult } from '@/types';

interface MissionInputProps {
  missionId?: string;
  onResult?: (result: EvaluationResult) => void;
}

export function MissionInput({ missionId, onResult }: MissionInputProps) {
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!missionId || prompt.trim().length <= 10) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, userPrompt: prompt }),
      });
      const data = await res.json() as { result: EvaluationResult };
      if (onResult) onResult(data.result);
    } catch {
      setError('Evaluation request failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!missionId) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-4 space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Craft your prompt here, adventurer..."
        rows={5}
        className="
          w-full rounded-xl border border-gold/30 bg-white dark:bg-night-blue-light
          text-slate-800 dark:text-slate-100 placeholder-slate-400
          p-3 text-sm resize-none focus:outline-none
          focus:ring-2 focus:ring-mystic-purple/50 transition
        "
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <Button
        onClick={handleSubmit}
        disabled={prompt.trim().length <= 10 || submitting}
        variant="primary"
        className="w-full"
      >
        {submitting ? 'Evaluating...' : 'Submit Prompt'}
      </Button>
    </div>
  );
}
