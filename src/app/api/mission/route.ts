import { NextResponse } from 'next/server';
import missions from '@/data/missions.json';
import { getDailyMission, getTodayDateString } from '@/lib/daily-mission';
import type { Mission } from '@/types';

export async function GET(): Promise<NextResponse> {
  try {
    const mission = getDailyMission(missions as Mission[]);
    const today = getTodayDateString();

    return NextResponse.json({ mission }, {
      status: 200,
      headers: {
        'X-Mission-Date': today,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[GET /api/mission]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve daily mission' },
      { status: 500 },
    );
  }
}
