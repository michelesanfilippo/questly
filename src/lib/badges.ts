import type { BadgeDefinition, SupabaseProfile } from '@/types';

// Maps badge index to image path in /public/images/badges/
export function getBadgeImagePath(index: number): string {
  const map: Record<number, string> = {
    0: '/images/badges/badge1.png',
  };
  return map[index] ?? '/images/badges/badge1.png';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { index: 0, name: 'First Step', description: 'Complete your first mission', requirement: 'Complete 1 mission' },
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
