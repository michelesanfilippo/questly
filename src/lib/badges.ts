import type { BadgeDefinition, SupabaseProfile } from '@/types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { index: 0, name: 'First Step', description: 'Complete your first mission', requirement: 'Complete 1 mission' },
  { index: 1, name: 'Apprentice', description: 'Prove your dedication', requirement: 'Complete 5 missions' },
  { index: 2, name: 'Curious Mind', description: 'Show your potential', requirement: 'Score >= 70 on any mission' },
  { index: 3, name: 'Wordsmith', description: 'Master of many quests', requirement: 'Complete 10 missions' },
  { index: 4, name: 'Context Master', description: 'The art of context', requirement: 'Context score >= 80' },
  { index: 5, name: 'Precision Seeker', description: 'Exactness is power', requirement: 'Precision score >= 85' },
  { index: 6, name: 'Chain Thinker', description: 'Reasoning mastery', requirement: 'Complete 3 chain-of-thought missions' },
  { index: 7, name: 'Prompt Knight', description: 'A true knight of prompts', requirement: 'Reach level 5' },
  { index: 8, name: 'Creative Sage', description: 'Born to create', requirement: 'Creativity score >= 90' },
  { index: 9, name: 'Streak Scholar', description: 'Consistency is key', requirement: 'Complete missions 7 days in a row' },
  { index: 10, name: 'Arcane Engineer', description: 'Few reach this mastery', requirement: 'Reach level 10' },
  { index: 11, name: 'Mythic Builder', description: 'A legend among prompters', requirement: 'Complete 50 missions' },
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
  check(1, profile.missions_completed >= 5);
  check(2, evaluation.scores.total >= 70);
  check(3, profile.missions_completed >= 10);
  check(4, evaluation.scores.context >= 80);
  check(5, evaluation.scores.precision >= 85);
  // index 6: chain-of-thought — cannot verify client-side, never auto-award
  check(7, profile.level >= 5);
  check(8, evaluation.scores.creativity >= 90);
  // index 9: streak tracking not in scope
  check(10, profile.level >= 10);
  check(11, profile.missions_completed >= 50);

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
