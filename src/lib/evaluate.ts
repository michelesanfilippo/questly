import type { Mission, EvaluationResult, EvaluationScore } from '@/types';

/**
 * Mock evaluator — replace body with Gemini API / Cloudflare AI call in production.
 * Scoring heuristics based on prompt length, keyword presence, and structure signals.
 */
export function evaluatePrompt(userPrompt: string, mission: Mission): EvaluationResult {
  const trimmed = userPrompt.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // Heuristic signals
  const hasRolePrompt = /you are|act as|as a/i.test(trimmed);
  const hasContext = /context:|background:|given that/i.test(trimmed);
  const hasOutputFormat = /json|markdown|table|list|format:|output:/i.test(trimmed);
  const hasStepByStep = /step by step|let's think|first.*then|1\.|2\./i.test(trimmed);
  const hasExamples = /example:|for instance|e\.g\./i.test(trimmed);

  // Mission-specific keyword bonus
  const missionKeywords = mission.evaluationKeywords ?? [];
  const promptLower = trimmed.toLowerCase();
  const keywordMatches = missionKeywords.filter(kw => promptLower.includes(kw.toLowerCase())).length;
  const keywordBonus = Math.min(keywordMatches * 8, 24);

  const creativity = clamp(40 + (wordCount > 50 ? 20 : 0) + (hasExamples ? 20 : 0) + (wordCount > 100 ? 20 : 0));
  const precision = clamp(30 + (hasOutputFormat ? 30 : 0) + (wordCount > 30 ? 20 : 0) + (hasContext ? 20 : 0) + keywordBonus);
  const context = clamp(20 + (hasContext ? 40 : 0) + (hasRolePrompt ? 25 : 0) + (wordCount > 40 ? 15 : 0));
  const structure = clamp(30 + (hasStepByStep ? 30 : 0) + (hasOutputFormat ? 20 : 0) + (wordCount > 60 ? 20 : 0));
  const promptEngineering = clamp(20 + (hasRolePrompt ? 20 : 0) + (hasContext ? 15 : 0) + (hasOutputFormat ? 15 : 0) + (hasStepByStep ? 15 : 0) + (hasExamples ? 15 : 0) + keywordBonus);

  const total = Math.round((creativity + precision + context + structure + promptEngineering) / 5);

  const scores: EvaluationScore = { creativity, precision, context, structure, promptEngineering, total };

  const xpAwarded = Math.round((total / 100) * mission.difficulty * 50);

  return {
    missionId: mission.id,
    scores,
    feedback: generateFeedback(scores, mission),
    suggestions: generateSuggestions(scores),
    xpAwarded,
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function generateFeedback(scores: EvaluationScore, mission: Mission): string {
  if (scores.total >= 80) return `Exceptional work, adventurer. Your prompt for "${mission.title}" demonstrates mastery of prompt engineering principles.`;
  if (scores.total >= 60) return `Solid attempt on "${mission.title}". You show understanding of core techniques but there is room to refine.`;
  if (scores.total >= 40) return `Decent start on "${mission.title}". Focus on adding more context and structure to strengthen your prompt.`;
  return `The oracle was not fully satisfied with your invocation of "${mission.title}". Study the ancient texts and try again.`;
}

function generateSuggestions(scores: EvaluationScore): string[] {
  const tips: string[] = [];
  if (scores.promptEngineering < 60) tips.push('Add a clear role definition: "You are a [role] with expertise in [domain]."');
  if (scores.context < 60) tips.push('Provide background context before the main instruction.');
  if (scores.structure < 60) tips.push('Use step-by-step instructions or numbered lists to guide the model.');
  if (scores.precision < 60) tips.push('Specify the exact output format: JSON, markdown, bullet list, etc.');
  if (scores.creativity < 60) tips.push('Add concrete examples (few-shot) to demonstrate the expected response style.');
  return tips.slice(0, 3);
}
