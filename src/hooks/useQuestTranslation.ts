'use client';

import { useState, useEffect } from 'react';
import type { Mission } from '@/types';

interface TranslatedQuest {
  narrativeDescription: string;
  task: string;
  hints?: string[];
}

function cacheKey(missionId: string, locale: string) {
  return `qt_${missionId}_${locale}`;
}

async function translateField(text: string, targetLocale: string): Promise<string> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLocale }),
  });
  const data = await res.json() as { translated: string };
  return data.translated ?? text;
}

export function useQuestTranslation(mission: Mission | null, locale: string) {
  const [translated, setTranslated] = useState<TranslatedQuest | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!mission || locale === 'en') {
      setTranslated(null);
      return;
    }

    const key = cacheKey(mission.id, locale);

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        setTranslated(JSON.parse(cached) as TranslatedQuest);
        return;
      }
    } catch { /* ignore */ }

    // Translate on-demand
    let cancelled = false;
    setTranslating(true);

    async function doTranslate() {
      if (!mission) return;
      try {
        const [narrativeDescription, task, ...translatedHints] = await Promise.all([
          translateField(mission.narrativeDescription, locale),
          translateField(mission.task, locale),
          ...(mission.hints?.map(h => translateField(h, locale)) ?? []),
        ]);

        if (cancelled) return;

        const result: TranslatedQuest = {
          narrativeDescription,
          task,
          hints: mission.hints ? translatedHints : undefined,
        };

        // Cache in localStorage
        try {
          localStorage.setItem(cacheKey(mission.id, locale), JSON.stringify(result));
        } catch { /* storage full, ignore */ }

        setTranslated(result);
      } catch {
        setTranslated(null);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    }

    void doTranslate();
    return () => { cancelled = true; };
  }, [mission?.id, locale]);

  return { translated, translating };
}
