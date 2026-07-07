import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabaseServer';
import { createFriendshipRequest, getFriendshipRows, removeFriendship } from '@/lib/friendsDb';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  const userId = auth.user.id;
  const data = await getFriendshipRows(userId);

  const friends = (data ?? [])
    .filter((row) => row.status === 'accepted')
    .map((row) => (row.user_low === userId ? row.user_high : row.user_low))
    .filter(Boolean);

  const incomingRows = (data ?? []).filter((row) => row.status === 'pending' && row.user_high === userId);
  const incomingRequestUserIds = incomingRows.map((row) => row.user_low).filter(Boolean);

  const supabase = await createSupabaseServerClient();
  let nicknameMap: Record<string, string> = {};

  if (incomingRequestUserIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from('profiles')
      .select('id,nickname')
      .in('id', incomingRequestUserIds);

    if (!profileError) {
      nicknameMap = Object.fromEntries((profileRows ?? []).map((profile) => [profile.id, profile.nickname ?? '']));
    }
  }

  const incomingRequests = incomingRows.map((row) => ({
    userId: row.user_low,
    nickname: nicknameMap[row.user_low] ?? row.user_low,
    requestedBy: row.requested_by,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ friends, incomingRequests });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  let body: { targetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { targetId } = body;
  if (!targetId || typeof targetId !== 'string') {
    return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
  }

  if (targetId === auth.user.id) {
    return NextResponse.json({ status: 'self' });
  }

  try {
    const result = await createFriendshipRequest(auth.user.id, targetId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Friend limit reached') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create friendship request' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  let body: { targetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { targetId } = body;
  if (!targetId || typeof targetId !== 'string') {
    return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
  }

  try {
    const result = await removeFriendship(auth.user.id, targetId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to remove friendship' }, { status: 500 });
  }
}
