import type { WorldFeature, UserProfile } from '@/types';

export const WORLD_FEATURES: WorldFeature[] = [
  {
    id: 'stars_enhanced',
    name: 'Enhanced Stars',
    requiredLevel: 2,
    description: 'The night sky fills with brighter stars.',
  },
  {
    id: 'constellation',
    name: 'Constellation',
    requiredLevel: 3,
    description: 'Ancient constellations appear above the village.',
  },
  {
    id: 'shooting_comet',
    name: 'Shooting Comet',
    requiredLevel: 4,
    description: 'A comet streaks across the sky at intervals.',
  },
  {
    id: 'dragon_silhouette',
    name: 'Dragon Silhouette',
    requiredLevel: 6,
    description: 'A dragon shadow circles the distant peaks.',
  },
  {
    id: 'spirit_glow',
    name: 'Spirit Glow',
    requiredLevel: 8,
    description: 'Ethereal spirits light the village paths.',
  },
  {
    id: 'tower_of_masters',
    name: 'Tower of Masters',
    requiredLevel: 10,
    description: 'The legendary tower rises on the horizon.',
  },
];

export function getUnlockedFeatures(profile: UserProfile): WorldFeature[] {
  return WORLD_FEATURES.filter((f) => profile.level >= f.requiredLevel);
}

export function getNewlyUnlocked(
  profile: UserProfile,
  previousLevel: number
): WorldFeature[] {
  return WORLD_FEATURES.filter(
    (f) => f.requiredLevel > previousLevel && f.requiredLevel <= profile.level
  );
}
