import { NextRequest, NextResponse } from 'next/server';
import missions from '@/data/missions.json';
import { evaluatePrompt } from '@/lib/evaluate';
import type { Mission } from '@/types';

interface EvaluateRequestBody {
  missionId: string;
  userPrompt: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Partial<EvaluateRequestBody>;

  try {
    body = (await request.json()) as Partial<EvaluateRequestBody>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { missionId, userPrompt } = body;

  // Validation
  if (!missionId || typeof missionId !== 'string') {
    return NextResponse.json(
      { error: 'missionId is required and must be a string' },
      { status: 400 },
    );
  }

  if (!userPrompt || typeof userPrompt !== 'string') {
    return NextResponse.json(
      { error: 'userPrompt is required and must be a string' },
      { status: 400 },
    );
  }

  if (userPrompt.trim().length <= 10) {
    return NextResponse.json(
      { error: 'userPrompt must be longer than 10 characters' },
      { status: 400 },
    );
  }

  const mission = (missions as Mission[]).find((m) => m.id === missionId);

  if (!mission) {
    return NextResponse.json(
      { error: `Mission with id "${missionId}" not found` },
      { status: 400 },
    );
  }

  try {
    const result = evaluatePrompt(userPrompt, mission);
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/evaluate]', error);
    return NextResponse.json(
      { error: 'Evaluation processing failed' },
      { status: 500 },
    );
  }
}
