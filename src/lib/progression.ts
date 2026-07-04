import type { UserProfile, EvaluationResult, Trophy } from '@/types';

export function xpForLevel(level: number): number {
  return level * 100;
}

export function addXP(profile: UserProfile, amount: number): UserProfile {
  let { xp, level } = profile;
  xp += amount;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }
  return { ...profile, xp, level };
}

export function updateStreak(profile: UserProfile): UserProfile {
  const today = new Date().toISOString().slice(0, 10);
  const last = profile.lastActiveDate;
  if (last === today) return profile;

  const lastDate = new Date(last);
  const todayDate = new Date(today);
  const diffMs = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  const streak = diffDays === 1 ? profile.streak + 1 : 1;
  return { ...profile, streak, lastActiveDate: today };
}

export function getTrophyDefinitions(): Trophy[] {
  return [
    {
      id: 'first_mission',
      name: 'First Mission',
      description: 'Complete your first mission.',
      icon: '★',
      condition: (p) => p.completedMissions.length >= 1,
    },
    {
      id: 'creative_mind',
      name: 'Creative Mind',
      description: 'Score 9+ in creativity.',
      icon: '✦',
      condition: (_p, ev) => (ev?.scores.creativity ?? 0) >= 9,
    },
    {
      id: 'precision_master',
      name: 'Precision Master',
      description: 'Score 9+ in precision.',
      icon: '◎',
      condition: (_p, ev) => (ev?.scores.precision ?? 0) >= 9,
    },
    {
      id: 'week_streak',
      name: 'Week Streak',
      description: 'Maintain a 7-day streak.',
      icon: '⚡',
      condition: (p) => p.streak >= 7,
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Complete a mission between 22:00 and 05:00.',
      icon: '◑',
      condition: () => {
        const h = new Date().getHours();
        return h >= 22 || h < 5;
      },
    },
    {
      id: 'prompt_knight',
      name: 'Prompt Knight',
      description: 'Reach level 3.',
      icon: '⚔',
      condition: (p) => p.level >= 3,
    },
    {
      id: 'arcane_engineer',
      name: 'Arcane Engineer',
      description: 'Reach level 6.',
      icon: '⬡',
      condition: (p) => p.level >= 6,
    },
    {
      id: 'mythic_builder',
      name: 'Mythic Builder',
      description: 'Reach level 10.',
      icon: '◈',
      condition: (p) => p.level >= 10,
    },
  ];
}

export function checkTrophies(
  profile: UserProfile,
  evaluation?: EvaluationResult
): string[] {
  const defs = getTrophyDefinitions();
  return defs
    .filter(
      (t) =>
        !profile.trophies.includes(t.id) && t.condition(profile, evaluation)
    )
    .map((t) => t.id);
}
