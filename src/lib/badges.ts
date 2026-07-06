import type { BadgeDefinition, SupabaseProfile } from '@/types';

export function getBadgeImagePath(index: number): string {
  const map: Record<number, string> = {
    0: '/images/badges/badge1.png',
    1: '/images/badges/badge_wizardapprentice.png',
    2: '/images/badges/badge_pathtocastle.png',
    3: '/images/badges/badge_royalknight.png',
    4: '/images/badges/badge_dragonhunter.png',
  };
  return map[index] ?? '/images/badges/badge1.png';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { index: 0, name: 'First Step',         description: 'Complete your first mission',                   requirement: 'Complete 1 mission' },
  { index: 1, name: 'Wizard Apprentice',  description: 'A promising apprentice of the arcane arts',     requirement: 'Complete 5 missions (difficulty 2★ or higher)' },
  { index: 2, name: 'Path to Castle',     description: 'You have walked the long road to the fortress', requirement: 'Complete 10 missions (difficulty 3★ or higher)' },
  { index: 3, name: 'Royal Knight',       description: 'Knighted by the realm for valor in battle',     requirement: 'Complete 5 missions (difficulty 4★ or higher)' },
  { index: 4, name: 'Dragon Hunter',      description: 'Only legends dare face the dragon three times',  requirement: 'Complete 3 missions (difficulty 5★)' },
];

export function checkNewBadges(
  profile: SupabaseProfile,
  evaluation: {
    scores: { creativity: number; precision: number; context: number; total: number };
    missionCategory?: string;
  },
  earnedIndexes: number[]
): number[] {
  const newBadges: number[] = [];

  const check = (index: number, condition: boolean) => {
    if (condition && !earnedIndexes.includes(index)) {
      newBadges.push(index);
    }
  };

  check(0, profile.missions_completed >= 1);
  check(1, (profile.missions_diff2plus ?? 0) >= 5);
  check(2, (profile.missions_diff3plus ?? 0) >= 10);
  check(3, (profile.missions_diff4plus ?? 0) >= 5);
  check(4, (profile.missions_diff5 ?? 0) >= 3);

  return newBadges;
}

export function xpForLevel(level: number): number {
  return level * 100;
}

export function addXPToProfile(
  profile: SupabaseProfile,
  xpToAdd: number
): { newXP: number; newLevel: number } {
  let xp = profile.xp + xpToAdd;
  let level = profile.level;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
  }
  return { newXP: xp, newLevel: level };
}
