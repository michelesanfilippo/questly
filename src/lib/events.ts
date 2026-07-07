// UTC scheduling helpers — consistent with daily-mission.ts

export function getTodayUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function currentWeekStart(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  // Monday-based week
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + diff);
  return `${mon.getUTCFullYear()}-${String(mon.getUTCMonth() + 1).padStart(2, '0')}-${String(mon.getUTCDate()).padStart(2, '0')}`;
}

export function isBossWeekend(): boolean {
  const day = new Date().getUTCDay();
  return day === 6 || day === 0; // Sat or Sun
}

export function isDuelDay(): boolean {
  return new Date().getUTCDay() === 3; // Wednesday
}

export function duelResolvesAt(now: Date): Date {
  const d = new Date(now);
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
  return d;
}
