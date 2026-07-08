/**
 * Shared Cloudflare AI helper.
 * Returns the first JSON object found in the model's response, or null on any failure.
 */
export async function callCloudflareAI(
  messages: Array<{ role: string; content: string }>,
  timeoutMs = 15000,
): Promise<string | null> {
  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;
  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_AI_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, max_tokens: 512, temperature: 0.3 }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!res.ok) return null;
    const data = await res.json() as { result?: { response?: string; choices?: { message?: { content?: string } }[] } };
    const raw = (data?.result?.choices?.[0]?.message?.content ?? data?.result?.response)?.trim();
    if (!raw) return null;
    return raw.match(/\{[\s\S]*\}/)?.[0] ?? null;
  } catch {
    return null;
  }
}
