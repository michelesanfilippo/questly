import type { BadgeDefinition, SupabaseProfile, NpcProgress } from '@/types';

export function getBadgeImagePath(index: number): string {
  const map: Record<number, string> = {
    0:  '/images/badges/badge1.png',
    1:  '/images/badges/badge_wizardapprentice.png',
    2:  '/images/badges/badge_pathtocastle.png',
    3:  '/images/badges/badge_royalknight.png',
    4:  '/images/badges/badge_dragonhunter.png',
    5:  '/images/badges/badge_sorcerer.png',
    6:  '/images/badges/badge_dayofrest.png',
    7:  '/images/badges/badge_explorer.png',
    8:  '/images/badges/badge_streak3.png',
    9:  '/images/badges/badge_sunrise.png',
    10: '/images/badges/badge_nightowl.png',
    11: '/images/badges/badge_student.png',
    12: '/images/badges/badge_bsmithapprentice.png',
  };
  return map[index] ?? '/images/badges/badge1.png';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { index: 0,  name: 'First Step',           description: 'Complete your first mission',                    requirement: '1 mission completed' },
  { index: 1,  name: 'Wizard Apprentice',     description: 'A promising apprentice of the arcane arts',     requirement: '5 missions (★2+), score > 60' },
  { index: 2,  name: 'Path to Castle',        description: 'You have walked the long road to the fortress', requirement: '10 missions (★3+), score > 60' },
  { index: 3,  name: 'Royal Knight',          description: 'Knighted by the realm for valor in battle',     requirement: '5 missions (★4+), score > 60' },
  { index: 4,  name: 'Dragon Hunter',         description: 'Only legends dare face the dragon three times', requirement: '3 missions (★5), score > 60' },
  { index: 5,  name: 'Sorcerer',              description: 'The arcane arts bend to your will',             requirement: '3 Wizard missions, score > 60' },
  { index: 6,  name: 'Day of Rest',           description: 'Even on rest days, heroes keep learning',       requirement: 'Complete a mission on Sunday' },
  { index: 7,  name: 'Explorer',              description: 'A true explorer of all knowledge domains',      requirement: 'Complete quests in 4 different NPC themes, score > 60' },
  { index: 8,  name: 'Streak Scholar',        description: 'Consistency builds mastery',                    requirement: '3 consecutive days login' },
  { index: 9,  name: 'Sunrise Seeker',        description: 'The early adventurer catches the dragon',       requirement: 'Complete a quest between 5am and 8am' },
  { index: 10, name: 'Night Owl',             description: 'The realm never sleeps, and neither do you',    requirement: 'Complete a quest between midnight and 4am' },
  { index: 11, name: 'Student of the Scroll', description: 'Knowledge is the greatest weapon',              requirement: '3 Library/Scholar quests, score > 60' },
  { index: 12, name: 'Blacksmith Apprentice', description: 'Iron sharpens iron',                            requirement: '3 Blacksmith quests, score > 60' },
];

export interface BadgeCheckContext {
  scores: { creativity: number; precision: number; context: number; total: number };
  missionDifficulty?: number;
  npcProgress?: NpcProgress[];
  submittedAt?: Date; // for time-based badges
  loginStreak?: number;
}

export function checkNewBadges(
  profile: SupabaseProfile,
  ctx: BadgeCheckContext,
  earnedIndexes: number[]
): number[] {
  const newBadges: number[] = [];
  const score = ctx.scores.total;
  const now = ctx.submittedAt ?? new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0=Sun

  const check = (index: number, condition: boolean) => {
    if (condition && !earnedIndexes.includes(index)) newBadges.push(index);
  };

  const npcCount = (npc: string) =>
    ctx.npcProgress?.find(p => p.npc_source === npc)?.quest_count ?? 0;
  const npcScore60 = (npc: string) =>
    ctx.npcProgress?.find(p => p.npc_source === npc)?.score60_count ?? 0;

  // Count NPC themes with at least 1 score60 completion
  const explorerThemes = ctx.npcProgress?.filter(p => p.score60_count >= 1).length ?? 0;

  check(0,  profile.missions_completed >= 1);
  check(1,  (profile.missions_diff2plus ?? 0) >= 5  && score > 60);
  check(2,  (profile.missions_diff3plus ?? 0) >= 10 && score > 60);
  check(3,  (profile.missions_diff4plus ?? 0) >= 5  && score > 60);
  check(4,  (profile.missions_diff5 ?? 0)     >= 3  && score > 60);
  check(5,  npcScore60('wizard') >= 3);
  check(6,  dayOfWeek === 0);                               // Sunday
  check(7,  explorerThemes >= 4 && score > 60);
  check(8,  (ctx.loginStreak ?? 0) >= 3);
  check(9,  hour >= 5 && hour < 8);                        // 5am-8am
  check(10, (hour >= 0 && hour < 4));                      // midnight-4am
  check(11, npcScore60('scholar') >= 3);
  check(12, npcScore60('blacksmith') >= 3);

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
