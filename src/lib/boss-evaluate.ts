import { callCloudflareAI } from '@/lib/ai';

/**
 * Evaluate a boss quest answer using Ollama/Cloudflare AI
 * Returns score, feedback, and suggestions
 */
export interface BossEvaluation {
  score: number;
  feedback: string;
  suggestions: string[];
}

export async function evaluateBossAnswer(
  bossName: string,
  questText: string,
  userAnswer: string
): Promise<BossEvaluation> {
  const DEFAULT: BossEvaluation = { score: 75, feedback: 'Your answer shows solid understanding of the challenge.', suggestions: [] };

  if (!questText || !userAnswer) return { score: 0, feedback: 'Please provide a complete answer.', suggestions: [] };

  const systemPrompt = `You are an expert evaluator for fantasy quest answers. Evaluate the quality of the user's answer to the quest.

You must respond ONLY with a valid JSON object in this exact format, no other text:
{
  "score": <number 0-100>,
  "feedback": "<2-3 sentence feedback in fantasy/medieval tone, encouraging or constructive>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}

Scoring criteria:
- score (0-100): Overall quality of the answer
  - 0-20: Blank, completely wrong, or irrelevant
  - 21-40: Partially correct but missing key elements
  - 41-60: Correct but lacks depth or detail
  - 61-80: Good answer with most elements covered
  - 81-100: Excellent answer, comprehensive and well-reasoned

Feedback should be brief, in a fantasy tone, and either encouraging or constructively critical.
Suggestions should be 1-3 actionable tips for improvement.`;

  const userMessage = `BOSS: ${bossName}
QUEST: ${questText}

USER'S ANSWER:
${userAnswer}

Evaluate this answer and respond with JSON only.`;

  const jsonStr = await callCloudflareAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
    10000,
  );
  if (!jsonStr) return DEFAULT;

  try {
    const parsed = JSON.parse(jsonStr) as {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    console.log(`[evaluateBossAnswer] Score: ${score} for answer: ${userAnswer.substring(0, 50)}...`);
    return {
      score,
      feedback: parsed.feedback || 'Your answer was evaluated.',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    };
  } catch (err) {
    console.error('[evaluateBossAnswer] Parse error:', err);
    return DEFAULT;
  }
}
