import { NextRequest, NextResponse } from 'next/server';
import { requireUser, createSupabaseAdminClient } from '@/lib/supabaseServer';

/**
 * POST /api/duels/[id]/decline
 * Challenged user declines the duel → challenger wins by forfeit (no XP awarded).
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
    .select('id, challenged_id, challenger_id, status')
    .eq('id', duelId)
    .single();

  if (fetchError || !duel) {
    return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
  }
  if (duel.challenged_id !== userId) {
    return NextResponse.json({ error: 'Only the challenged player can decline' }, { status: 403 });
  }
  if (duel.status !== 'pending') {
    return NextResponse.json({ error: 'Duel cannot be declined at this stage' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('duels')
    .update({
      status: 'declined',
      winner_id: duel.challenger_id, // challenger wins by forfeit
      challenger_seen: false,
      challenged_seen: true,         // challenger sees the forfeit result
    })
    .eq('id', duelId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to decline duel' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
