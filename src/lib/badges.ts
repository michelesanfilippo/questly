import type { Badge, UserProfile } from '@/types';

export const BADGES: Badge[] = [
  {
    id: 'apprentice',
    name: 'Apprentice',
    minLevel: 1,
    maxLevel: 2,
    color: 'text-slate-400',
  },
  {
    id: 'prompt_knight',
    name: 'Prompt Knight',
    minLevel: 3,
    maxLevel: 5,
    color: 'text-purple-400',
  },
  {
    id: 'arcane_engineer',
    name: 'Arcane Engineer',
    minLevel: 6,
    maxLevel: 9,
    color: 'text-blue-400',
  },
  {
    id: 'mythic_builder',
    name: 'Mythic Builder',
    minLevel: 10,
    maxLevel: 99,
    color: 'text-amber-400',
  },
];

export function getAllBadges(): Badge[] {
  return BADGES;
}

export function getBadge(profile: UserProfile): Badge {
  const match = [...BADGES]
    .reverse()
    .find((b) => profile.level >= b.minLevel && profile.level <= b.maxLevel);
  return match ?? BADGES[0];
}
