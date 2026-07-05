// Mission difficulty: 1 (novice) to 5 (legendary)
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type MissionCategory =
  | 'prompt-basics'
  | 'context-crafting'
  | 'chain-of-thought'
  | 'role-prompting'
  | 'few-shot'
  | 'output-formatting'
  | 'multimodal'
  | 'agents';

export interface Mission {
  id: string;
  title: string;
  narrativeDescription: string;
  task: string;
  difficulty: Difficulty;
  category: MissionCategory;
  tags: string[];
  weekendOnly: boolean;
  hints?: string[];
  evaluationKeywords?: string[];
}

export interface EvaluateRequest {
  missionId: string;
  userPrompt: string;
}

export interface EvaluationScore {
  creativity: number;
  precision: number;
  context: number;
  structure: number;
  promptEngineering: number;
  total: number;
}

export interface EvaluationResult {
  missionId: string;
  scores: EvaluationScore;
  feedback: string;
  suggestions: string[];
  xpAwarded: number;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string; // initials derived from nickname
  createdAt: string; // ISO date
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  trophies: string[]; // trophy IDs
  badges: string[]; // badge IDs earned
  unlockedWorldFeatures: string[];
  completedMissions: string[];
}

export interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (profile: UserProfile, evaluation?: EvaluationResult) => boolean;
}

export interface Badge {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string; // tailwind color class
}

export interface WorldFeature {
  id: string;
  name: string;
  requiredLevel: number;
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  level: number;
  xp: number;
  badge: string;
}
