import type { Mission } from '@/types';

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Deterministic PRNG (mulberry32) — same seed = same sequence
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with deterministic RNG
function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDailyMission(missions: Mission[]): Mission {
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12
  const day   = today.getDate();      // 1-31
  const dayOfWeek = today.getDay();   // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Build pool: weekends prefer hard missions, weekdays prefer easier
  const pool = isWeekend
    ? missions.filter(m => m.weekendOnly || m.difficulty >= 4)
    : missions.filter(m => !m.weekendOnly && m.difficulty <= 3);

  const activePool = pool.length >= 28 ? pool : missions; // fallback if pool too small

  // Monthly shuffle seed: unique per year+month
  // Same pool shuffled the same way for the entire month
  const monthlySeed = year * 10000 + month * 100;
  const shuffled = shuffleDeterministic(activePool, monthlySeed);

  // Day index within the month (0-based) → picks a unique mission per day
  // If month has more days than pool, wrap around but stay within shuffled order
  const dayIndex = (day - 1) % shuffled.length;

  return shuffled[dayIndex];
}
