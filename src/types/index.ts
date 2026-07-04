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

// Future auth slot
export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  provider: 'google' | 'microsoft' | 'apple';
  xp: number;
  level: number;
  completedMissions: string[];
  // TODO: leaderboard rank when ranking system is implemented
}
