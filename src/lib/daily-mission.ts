import type { Mission } from '@/types';

/**
 * Returns an ISO date string (YYYY-MM-DD) for today.
 * Exported for use in API route headers.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Deterministic daily mission selection.
 * - Weekends (Sat/Sun): pool weighted toward difficulty 4-5
 * - Weekdays: pool is difficulty 1-3 + non-weekendOnly
 * - Seed is date string → consistent mission all day, changes at midnight
 */
export function getDailyMission(missions: Mission[]): Mission {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const pool = isWeekend
    ? missions.filter((m) => m.weekendOnly || m.difficulty >= 4)
    : missions.filter((m) => !m.weekendOnly && m.difficulty <= 3);

  const activPool = pool.length > 0 ? pool : missions;

  // Deterministic index from date seed
  const dateStr = getTodayDateString();
  const seed = dateStr.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const index = seed % activPool.length;

  return activPool[index];
}
