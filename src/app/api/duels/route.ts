import { NextRequest, NextResponse } from 'next/server';
import { requireUser, createSupabaseAdminClient } from '@/lib/supabaseServer';
import missions from '@/data/missions.json';
import type { Mission } from '@/types';

/**
 * GET /api/duels
 * Returns active/recent duels for the current user
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const supabase = await createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('duels')
    .select(`
      id, status, created_at, updated_at,
      challenger_id, challenged_id,
      mission_id, mission_snapshot,
      challenger_answer, challenger_score,
      challenged_answer, challenged_score,
      winner_id
    `)
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[GET /api/duels]', error);
    return NextResponse.json({ error: 'Failed to fetch duels' }, { status: 500 });
  }

  // Enrich with opponent profiles
  const opponentIds = (data ?? []).map(d =>
    d.challenger_id === userId ? d.challenged_id : d.challenger_id
  );
  const uniqueOpponentIds = [...new Set(opponentIds)];

  let profileMap: Record<string, string> = {};
  if (uniqueOpponentIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', uniqueOpponentIds);
    profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.nickname]));
  }

  const duels = (data ?? []).map(d => ({
    ...d,
    opponent_id: d.challenger_id === userId ? d.challenged_id : d.challenger_id,
    opponent_nickname: profileMap[d.challenger_id === userId ? d.challenged_id : d.challenger_id] ?? 'Unknown',
    is_challenger: d.challenger_id === userId,
  }));

  return NextResponse.json({ duels });
}

/**
 * POST /api/duels
 * Create a new duel challenge
 * Body: { challengedId: string }
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  let body: { challengedId?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { challengedId } = body;
  if (!challengedId || typeof challengedId !== 'string') {
    return NextResponse.json({ error: 'challengedId is required' }, { status: 400 });
  }
  if (challengedId === userId) {
    return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 });
  }

  const supabase = await createSupabaseAdminClient();

  // Verify they are friends
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(user_low.eq.${[userId, challengedId].sort()[0]},user_high.eq.${[userId, challengedId].sort()[1]})`
    )
    .maybeSingle();

  if (!friendship) {
    return NextResponse.json({ error: 'You can only duel friends' }, { status: 400 });
  }

  // Check no pending duel between these two specifically
  const sortedLow = [userId, challengedId].sort()[0];
  const sortedHigh = [userId, challengedId].sort()[1];
  const { data: existingDuel } = await supabase
    .from('duels')
    .select('id')
    .in('status', ['pending', 'challenger_answered', 'challenged_answered'])
    .or(
      `and(challenger_id.eq.${sortedLow},challenged_id.eq.${sortedHigh}),and(challenger_id.eq.${sortedHigh},challenged_id.eq.${sortedLow})`
    )
    .maybeSingle();

  if (existingDuel) {
    return NextResponse.json({ error: 'A duel already exists between you two' }, { status: 400 });
  }

  // Pick a random mission
  const missionPool = (missions as Mission[]).filter(m => !m.weekendOnly);
  const mission = missionPool[Math.floor(Math.random() * missionPool.length)];

  const { data: duel, error } = await supabase
    .from('duels')
    .insert({
      challenger_id: userId,
      challenged_id: challengedId,
      mission_id: mission.id,
      mission_snapshot: mission,
      status: 'pending',
    })
    .select('id, status, mission_id, mission_snapshot, challenger_id, challenged_id')
    .single();

  if (error) {
    console.error('[POST /api/duels]', error);
    return NextResponse.json({ error: 'Failed to create duel' }, { status: 500 });
  }

  return NextResponse.json({ duel }, { status: 201 });
}
