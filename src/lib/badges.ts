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
    13: '/images/badges/badge_streak10.png',
    14: '/images/badges/badge_crown.png',
    15: '/images/badges/badge_hydra.png',
  };
  return map[index] ?? '/images/badges/badge1.png';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { index: 0,  name: 'First Step',           description: 'Complete your first mission',                    requirement: '1 mission completed' },
  { index: 1,  name: 'Wizard Apprentice',     description: 'A promising apprentice of the arcane arts',     requirement: '5 missions (★2+), score > 60' },
  { index: 2,  name: 'Path to Castle',        description: 'You have walked the long road to the fortress', requirement: '10 missions (★3+), score > 60' },
  { index: 3,  name: 'Royal Knight',          description: 'Knighted by the realm for valor in battle',     requirement: '5 missions (★4+), score > 60' },
  { index: 4,  name: 'Dragon Hunter',         description: 'Only legends dare face the dragon seven times',  requirement: '7 missions (★5), score > 60' },
  { index: 5,  name: 'Sorcerer',              description: 'The arcane arts bend to your will',             requirement: '3 Wizard missions, score > 60' },
  { index: 6,  name: 'Day of Rest',           description: 'Even on rest days, heroes keep learning',       requirement: 'Complete a mission on Sunday' },
  { index: 7,  name: 'Explorer',              description: 'A true explorer of all knowledge domains',      requirement: 'Complete quests in 4 different NPC themes, score > 60' },
  { index: 8,  name: 'Streak Scholar',        description: 'Consistency builds mastery',                    requirement: '3 consecutive days login' },
  { index: 9,  name: 'Sunrise Seeker',        description: 'The early adventurer catches the dragon',       requirement: 'Complete a quest between 5am and 8am' },
  { index: 10, name: 'Night Owl',             description: 'The realm never sleeps, and neither do you',    requirement: 'Complete a quest between midnight and 4am' },
  { index: 11, name: 'Student of the Scroll', description: 'Knowledge is the greatest weapon',              requirement: '3 Library/Scholar quests, score > 60' },
  { index: 12, name: 'Blacksmith Apprentice', description: 'Iron sharpens iron',                            requirement: '3 Blacksmith quests, score > 60' },
  { index: 13, name: 'Undying Flame',         description: 'Ten days of unbroken dedication to the realm',  requirement: '10 consecutive days login' },
  { index: 14, name: 'Crown Oath',            description: 'Sworn to serve the crown with excellence',      requirement: '5 royal quests, score > 60' },
  { index: 15, name: 'Hydra Slayer',          description: 'Where one head falls, three more were defeated', requirement: '3 missions (★5), score > 60' },
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
  check(4,  (profile.missions_diff5 ?? 0)     >= 7  && score > 60);
  check(5,  npcScore60('wizard') >= 3);
  check(6,  dayOfWeek === 0);                               // Sunday
  check(7,  explorerThemes >= 4 && score > 60);
  check(8,  (ctx.loginStreak ?? 0) >= 3);
  check(9,  hour >= 5 && hour < 8);                        // 5am-8am
  check(10, (hour >= 0 && hour < 4));                      // midnight-4am
  check(11, npcScore60('scholar') >= 3);
  check(12, npcScore60('blacksmith') >= 3);
  check(13, (ctx.loginStreak ?? 0) >= 10);
  check(14, npcScore60('royal') >= 5 && score > 60);
  check(15, (profile.missions_diff5 ?? 0) >= 3 && score > 60);

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

/**
 * Boss Weekend Badge Definitions
 * Index 16-21 reserved for boss badges
 */
export const BOSS_BADGE_MAP: Record<string, { index: number; name: string; description: string }> = {
  goblin: {
    index: 16,
    name: 'Goblin Slayer',
    description: 'Defeated the Goblin boss',
  },
  fata: {
    index: 17,
    name: 'Fairy Vanquisher',
    description: 'Defeated the Fairy boss',
  },
  lupo_mannaro: {
    index: 18,
    name: 'Werewolf Hunter',
    description: 'Defeated the Werewolf boss',
  },
  minotauro: {
    index: 19,
    name: 'Minotaur Slayer',
    description: 'Defeated the Minotaur boss',
  },
  gnomo: {
    index: 20,
    name: 'Gnome Crusher',
    description: 'Defeated the Gnome boss',
  },
  gigante: {
    index: 21,
    name: 'Giant Killer',
    description: 'Defeated the Giant boss',
  },
  grifone: {
    index: 22,
    name: 'Griffin Tamer',
    description: 'Defeated the Griffin boss',
  },
  ippogrifo: {
    index: 23,
    name: 'Hippogriff Breaker',
    description: 'Defeated the Hippogriff boss',
  },
  idra: {
    index: 24,
    name: 'Hydra Head Collector',
    description: 'Defeated the Hydra boss',
  },
  fenice: {
    index: 25,
    name: 'Phoenix Extinguisher',
    description: 'Defeated the Phoenix boss',
  },
  basilisco: {
    index: 26,
    name: 'Basilisk Petrifier',
    description: 'Defeated the Basilisk boss',
  },
  kraken: {
    index: 27,
    name: 'Kraken Deeps',
    description: 'Defeated the Kraken boss',
  },
  leviatano: {
    index: 28,
    name: 'Leviathan Tamer',
    description: 'Defeated the Leviathan boss',
  },
  drago_comune: {
    index: 29,
    name: 'Common Dragon Slayer',
    description: 'Defeated the Common Dragon boss',
  },
  drago_verde: {
    index: 30,
    name: 'Green Dragon Slayer',
    description: 'Defeated the Green Dragon boss',
  },
  drago_rosso: {
    index: 31,
    name: 'Red Dragon Slayer',
    description: 'Defeated the Red Dragon boss',
  },
  drago_nero: {
    index: 32,
    name: 'Black Dragon Slayer',
    description: 'Defeated the Black Dragon boss',
  },
  drago_bianco: {
    index: 33,
    name: 'White Dragon Slayer',
    description: 'Defeated the White Dragon boss',
  },
};

/**
 * Returns the badge index for a defeated boss
 * Returns -1 if boss not found
 */
export function getBossBadgeIndex(bossKey: string): number {
  return BOSS_BADGE_MAP[bossKey]?.index ?? -1;
}

/**
 * Assigns boss badge to guild members who participated in the fight
 * To be called via POST /api/boss/assign-badge after boss defeat
 *
 * @param bossKey - The boss key ('goblin', 'drago_bianco', etc)
 * @param userIds - Array of user IDs who participated
 * @returns Promise with supabase update result
 *
 * Usage:
 *   const badgeIndex = getBossBadgeIndex('goblin');
 *   if (badgeIndex !== -1) {
 *     await supabase
 *       .from('profiles')
 *       .update({ badges: ... }) // Add badgeIndex to array
 *       .in('id', userIds);
 *   }
 */
export async function assignBossBadges(
  supabase: any,
  bossKey: string,
  userIds: string[]
): Promise<void> {
  const badgeIndex = getBossBadgeIndex(bossKey);

  if (badgeIndex === -1) {
    console.warn(`No badge defined for boss: ${bossKey}`);
    return;
  }

  // For each user, add badge to their badges array (if not already present)
  for (const userId of userIds) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('badges')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error(`Failed to fetch profile for ${userId}:`, fetchError);
      continue;
    }

    const badges = profile?.badges ?? [];

    // Only add if not already present
    if (!badges.includes(badgeIndex)) {
      badges.push(badgeIndex);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ badges })
        .eq('id', userId);

      if (updateError) {
        console.error(`Failed to update badge for ${userId}:`, updateError);
      }
    }
  }
}
