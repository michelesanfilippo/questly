import { NextRequest, NextResponse } from 'next/server';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_AI_TOKEN   = process.env.CLOUDFLARE_AI_TOKEN;
const CF_MODEL      = '@cf/meta/llama-3.1-8b-instruct';

interface TranslateRequest {
  text: string;
  targetLocale: string;
}

interface CFResponse {
  result?: {
    response?: string;
    choices?: { message?: { content?: string } }[];
  };
}

const LANG_NAMES: Record<string, string> = {
  it: 'Italian', fr: 'French', es: 'Spanish', de: 'German',
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as Partial<TranslateRequest>;
  const { text, targetLocale } = body;

  if (!text || !targetLocale || targetLocale === 'en') {
    return NextResponse.json({ translated: text ?? '' });
  }

  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
    return NextResponse.json({ translated: text });
  }

  const langName = LANG_NAMES[targetLocale] ?? targetLocale;

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
            {
              role: 'system',
              content: `You are a translator. Translate the following text to ${langName}. Return ONLY the translated text, nothing else. Preserve any formatting, line breaks, and tone. Keep fantasy/medieval style if present.`,
            },
            { role: 'user', content: text },
          ],
          max_tokens: 2048,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!res.ok) return NextResponse.json({ translated: text });

    const data = await res.json() as CFResponse;
    const translated =
      data?.result?.choices?.[0]?.message?.content?.trim() ??
      data?.result?.response?.trim() ??
      text;

    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ translated: text });
  }
}
