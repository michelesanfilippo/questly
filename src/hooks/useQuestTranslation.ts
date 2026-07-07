'use client';

import { useState, useEffect } from 'react';
import type { Mission } from '@/types';

interface TranslatedQuest {
  title: string;
  narrativeDescription: string;
  task: string;
  hints?: string[];
  cachedAt: number; // unix ms
}

const CACHE_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const CACHE_PREFIX = 'qt_';
const CACHE_VERSION = 'v3'; // bump to invalidate all cached translations

function cacheKey(missionId: string, locale: string) {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${missionId}_${locale}`;
}

function purgeStaleCache() {
  try {
    const now = Date.now();
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CACHE_PREFIX)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<TranslatedQuest>;
        if (!entry.cachedAt || now - entry.cachedAt > CACHE_TTL_MS) {
          toRemove.push(key);
        }
      } catch {
        toRemove.push(key!);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

async function translateBatch(items: string[], targetLocale: string): Promise<string[]> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, targetLocale }),
  });
  const data = await res.json() as { translated: string[] };
  // Fall back to the originals if the shape/length is unexpected.
  return Array.isArray(data.translated) && data.translated.length === items.length
    ? data.translated
    : items;
}

export function useQuestTranslation(mission: Mission | null, locale: string) {
  const [translated, setTranslated] = useState<TranslatedQuest | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    // Purge stale entries on every locale change
    purgeStaleCache();

    if (!mission || locale === 'en') {
      setTranslated(null);
      return;
    }

    const key = cacheKey(mission.id, locale);

    // Check localStorage cache
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const entry = JSON.parse(raw) as TranslatedQuest;
        // Double-check TTL (in case purge ran before this mount)
        if (Date.now() - (entry.cachedAt ?? 0) <= CACHE_TTL_MS) {
          setTranslated(entry);
          return;
        }
        localStorage.removeItem(key);
      }
    } catch { /* ignore */ }

    // Translate on-demand
    let cancelled = false;
    setTranslating(true);

    async function doTranslate() {
      if (!mission) return;
      try {
        // Translate all quest fields in ONE request so the model has the full
        // context of the quest (correct articles, gender/number agreement and
        // consistent terminology), instead of translating each field blindly.
        const hints = mission.hints ?? [];
        const items = [mission.title, mission.narrativeDescription, mission.task, ...hints];
        const [title, narrativeDescription, task, ...translatedHints] =
          await translateBatch(items, locale);

        if (cancelled) return;

        const result: TranslatedQuest = {
          title,
          narrativeDescription,
          task,
          hints: mission.hints ? translatedHints : undefined,
          cachedAt: Date.now(),
        };

        try {
          localStorage.setItem(key, JSON.stringify(result));
        } catch { /* storage full */ }

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
