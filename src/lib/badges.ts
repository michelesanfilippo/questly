import type { BadgeDefinition, SupabaseProfile, NpcProgress } from '@/types';

export function getBadgeImagePath(index: number): string {
  const map: Record<number, string> = {
    0: '/images/badges/badge1.png',
    1: '/images/badges/badge_wizardapprentice.png',
    2: '/images/badges/badge_pathtocastle.png',
    3: '/images/badges/badge_royalknight.png',
    4: '/images/badges/badge_dragonhunter.png',
    5: '/images/badges/badge_sorcerer.png',
  };
  return map[index] ?? '/images/badges/badge1.png';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { index: 0, name: 'First Step',        description: 'Complete your first mission',                              requirement: '1 mission completed, any score' },
  { index: 1, name: 'Wizard Apprentice', description: 'A promising apprentice of the arcane arts',               requirement: '5 missions (★2+), score > 60' },
  { index: 2, name: 'Path to Castle',    description: 'You have walked the long road to the fortress',           requirement: '10 missions (★3+), score > 60' },
  { index: 3, name: 'Royal Knight',      description: 'Knighted by the realm for valor in battle',               requirement: '5 missions (★4+), score > 60' },
  { index: 4, name: 'Dragon Hunter',     description: 'Only legends dare face the dragon three times',           requirement: '3 missions (★5), score > 60' },
  { index: 5, name: 'Sorcerer',          description: 'The arcane arts bend to your will',                       requirement: '3 Wizard missions, score > 60' },
];

export interface BadgeCheckContext {
  scores: { creativity: number; precision: number; context: number; total: number };
  missionDifficulty?: number;
  npcProgress?: NpcProgress[];
}

export function checkNewBadges(
  profile: SupabaseProfile,
  ctx: BadgeCheckContext,
  earnedIndexes: number[]
): number[] {
  const newBadges: number[] = [];
  const score = ctx.scores.total;

  const check = (index: number, condition: boolean) => {
    if (condition && !earnedIndexes.includes(index)) newBadges.push(index);
  };

  const npcCount = (npc: string) =>
    ctx.npcProgress?.find(p => p.npc_source === npc)?.quest_count ?? 0;

  check(0, profile.missions_completed >= 1);
  check(1, (profile.missions_diff2plus ?? 0) >= 5  && score > 60);
  check(2, (profile.missions_diff3plus ?? 0) >= 10 && score > 60);
  check(3, (profile.missions_diff4plus ?? 0) >= 5  && score > 60);
  check(4, (profile.missions_diff5 ?? 0)     >= 3  && score > 60);
  check(5, npcCount('wizard') >= 3                 && score > 60);

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
