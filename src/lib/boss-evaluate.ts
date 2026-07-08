/**
 * Evaluate a boss quest answer using Ollama/Cloudflare AI
 * Returns a score (0-100) based on answer quality
 */
export async function evaluateBossAnswer(
  bossName: string,
  questText: string,
  userAnswer: string
): Promise<number> {
  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;
  const CF_MODEL = '@cf/meta/llama-3.1-8b-instruct';

  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
    console.warn('[evaluateBossAnswer] Missing Cloudflare credentials, using default score 75');
    return 75;
  }

  if (!questText || !userAnswer) {
    return 0;
  }

  const systemPrompt = `You are an expert evaluator for fantasy quest answers. Evaluate the quality of the user's answer to the quest.

You must respond ONLY with a valid JSON object in this exact format, no other text:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>"
}

Scoring criteria:
- score (0-100): Overall quality of the answer
  - 0-20: Blank, completely wrong, or irrelevant
  - 21-40: Partially correct but missing key elements
  - 41-60: Correct but lacks depth or detail
  - 61-80: Good answer with most elements covered
  - 81-100: Excellent answer, comprehensive and well-reasoned`;

  const userMessage = `BOSS: ${bossName}
QUEST: ${questText}

USER'S ANSWER:
${userAnswer}

Evaluate this answer and respond with JSON only.`;

  try {
    const response = await fetch(
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
          max_tokens: 256,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.warn('[evaluateBossAnswer] API error, using default score 75');
      return 75;
    }

    const data = (await response.json()) as any;
    const raw = (
      data?.result?.choices?.[0]?.message?.content ??
      data?.result?.response
    )?.trim();

    if (!raw) {
      console.warn('[evaluateBossAnswer] No response from AI, using default score 75');
      return 75;
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[evaluateBossAnswer] No JSON in response, using default score 75');
      return 75;
    }

    const parsed = JSON.parse(jsonMatch[0]) as { score: number; reasoning: string };
    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    
    console.log(`[evaluateBossAnswer] Score: ${score} for answer: ${userAnswer.substring(0, 50)}...`);
    return score;
  } catch (err) {
    console.error('[evaluateBossAnswer] Error:', err);
    return 75; // Default score on error
  }
}
