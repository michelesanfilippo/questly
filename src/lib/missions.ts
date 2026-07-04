import missionsData from '@/data/missions.json';
import type { Mission, Difficulty, MissionCategory } from '@/types';

export const allMissions: Mission[] = missionsData as Mission[];

export function getMissionById(id: string): Mission | undefined {
  return allMissions.find((m) => m.id === id);
}

export function getMissionsByDifficulty(difficulty: Difficulty): Mission[] {
  return allMissions.filter((m) => m.difficulty === difficulty);
}

export function getMissionsByCategory(category: MissionCategory): Mission[] {
  return allMissions.filter((m) => m.category === category);
}

export function getWeekendMissions(): Mission[] {
  return allMissions.filter((m) => m.weekendOnly || m.difficulty >= 4);
}

export function getWeekdayMissions(): Mission[] {
  return allMissions.filter((m) => !m.weekendOnly && m.difficulty <= 3);
}
