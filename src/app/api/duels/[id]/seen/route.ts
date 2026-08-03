import { NextRequest, NextResponse } from 'next/server';
import { requireUser, createSupabaseAdminClient } from '@/lib/supabaseServer';

/**
 * POST /api/duels/[id]/seen
 * Marks the current user's result as seen so it won't show again on next load.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const { id: duelId } = await params;
  const supabase = await createSupabaseAdminClient();

  const { data: duel, error: fetchError } = await supabase
    .from('duels')
    .select('id, challenger_id, challenged_id')
    .eq('id', duelId)
    .single();

  if (fetchError || !duel) {
    return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
  }

  const updateCol =
    duel.challenger_id === userId ? { challenger_seen: true } :
    duel.challenged_id === userId ? { challenged_seen: true } :
    null;

  if (!updateCol) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
  }

  await supabase.from('duels').update(updateCol).eq('id', duelId);

  return NextResponse.json({ ok: true });
}
