import { NextResponse } from 'next/server';

export async function GET() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_AI_TOKEN;

  if (!accountId || !token) {
    return NextResponse.json({ error: 'Missing env vars', accountId: !!accountId, token: !!token });
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Reply with just the word: OK' },
          ],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const text = await res.text();
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      body: text,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
