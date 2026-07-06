import type { Mission, EvaluationResult, EvaluationScore } from '@/types';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;
const CF_MODEL = '@cf/meta/llama-3.1-8b-instruct';

interface CFResponse {
  result?: {
    response?: string;
  };
}

async function evaluateWithAI(userPrompt: string, mission: Mission): Promise<EvaluationResult | null> {
  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) return null;

  const systemPrompt = `You are an expert prompt engineering evaluator. You evaluate user-written prompts based on how well they solve a given quest/task.

You must respond ONLY with a valid JSON object in this exact format, no other text:
{
  "creativity": <number 0-100>,
  "precision": <number 0-100>,
  "context": <number 0-100>,
  "structure": <number 0-100>,
  "promptEngineering": <number 0-100>,
  "feedback": "<2-3 sentence feedback in fantasy/medieval tone>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}

Scoring criteria:
- creativity (0-100): originality, use of examples, unexpected approaches
- precision (0-100): clear instructions, specific constraints, output format specified
- context (0-100): role definition, background info, audience specification
- structure (0-100): logical flow, numbered steps, clear sections
- promptEngineering (0-100): overall mastery — role prompting, chain-of-thought, few-shot, format control

Keep feedback in a fantasy/medieval adventure tone (short, encouraging or constructive).
Suggestions must be actionable and specific (max 3).`;

  const userMessage = `QUEST: ${mission.title}
QUEST DESCRIPTION: ${mission.task}

USER PROMPT TO EVALUATE:
${userPrompt}

Evaluate this prompt and respond with JSON only.`;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_AI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 512,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) return null;

    const data = await res.json() as CFResponse;
    const raw = data?.result?.response?.trim();
    if (!raw) return null;

    // Extract JSON from response (model might add extra text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      creativity: number;
      precision: number;
      context: number;
      structure: number;
      promptEngineering: number;
      feedback: string;
      suggestions: string[];
    };

    const scores: EvaluationScore = {
      creativity: clamp(Math.round(parsed.creativity)),
      precision: clamp(Math.round(parsed.precision)),
      context: clamp(Math.round(parsed.context)),
      structure: clamp(Math.round(parsed.structure)),
      promptEngineering: clamp(Math.round(parsed.promptEngineering)),
      total: 0,
    };
    scores.total = Math.round(
      (scores.creativity + scores.precision + scores.context + scores.structure + scores.promptEngineering) / 5
    );

    return {
      missionId: mission.id,
      scores,
      feedback: parsed.feedback ?? generateFeedback(scores, mission),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      xpAwarded: Math.round((scores.total / 100) * mission.difficulty * 50),
    };
  } catch {
    return null;
  }
}

export async function evaluatePrompt(userPrompt: string, mission: Mission): Promise<EvaluationResult> {
  // Try Cloudflare AI first
  const aiResult = await evaluateWithAI(userPrompt, mission);
  if (aiResult) return aiResult;

  // Fallback: heuristic evaluation
  return evaluateHeuristic(userPrompt, mission);
}

function evaluateHeuristic(userPrompt: string, mission: Mission): EvaluationResult {
  const trimmed = userPrompt.trim();
  const wordCount = trimmed.split(/\s+/).length;

  const hasRolePrompt = /you are|act as|as a/i.test(trimmed);
  const hasContext = /context:|background:|given that/i.test(trimmed);
  const hasOutputFormat = /json|markdown|table|list|format:|output:/i.test(trimmed);
  const hasStepByStep = /step by step|let's think|first.*then|1\.|2\./i.test(trimmed);
  const hasExamples = /example:|for instance|e\.g\./i.test(trimmed);

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

  return {
    missionId: mission.id,
    scores,
    feedback: generateFeedback(scores, mission),
    suggestions: generateSuggestions(scores),
    xpAwarded: Math.round((total / 100) * mission.difficulty * 50),
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
