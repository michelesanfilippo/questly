import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabaseServer';
import { respondToFriendshipRequest } from '@/lib/friendsDb';

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  let body: { targetId?: string; accept?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { targetId, accept } = body;
  if (!targetId || typeof targetId !== 'string') {
    return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
  }
  if (typeof accept !== 'boolean') {
    return NextResponse.json({ error: 'accept is required' }, { status: 400 });
  }

  try {
    const result = await respondToFriendshipRequest(auth.user.id, targetId, accept);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Request not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Only the recipient can respond') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update friendship request' }, { status: 500 });
  }
}
