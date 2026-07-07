import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function getFriendshipRows(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('friendships')
    .select('id,user_low,user_high,status,requested_by,created_at')
    .or(`user_low.eq.${userId},user_high.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createFriendshipRequest(currentUserId: string, targetId: string) {
  const supabase = await createSupabaseServerClient();
  const normalizedPair = [currentUserId, targetId].sort();

  const { data: existingRows, error: lookupError } = await supabase
    .from('friendships')
    .select('id,status,requested_by,user_low,user_high')
    .or(`user_low.eq.${currentUserId},user_high.eq.${currentUserId}`);

  if (lookupError) throw lookupError;

  const existing = (existingRows ?? []).find((row) => {
    const pair = [row.user_low, row.user_high].sort();
    return pair[0] === normalizedPair[0] && pair[1] === normalizedPair[1];
  });

  if (existing?.status === 'accepted') {
    return { status: 'friends' as const };
  }

  if (existing?.status === 'pending') {
    return { status: existing.requested_by === currentUserId ? 'pending_outgoing' as const : 'pending_incoming' as const };
  }

  const [{ count: currentCount }, { count: targetCount }] = await Promise.all([
    supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`user_low.eq.${currentUserId},user_high.eq.${currentUserId}`),
    supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`user_low.eq.${targetId},user_high.eq.${targetId}`),
  ]);

  if ((currentCount ?? 0) >= 20 || (targetCount ?? 0) >= 20) {
    throw new Error('Friend limit reached');
  }

  const { error: insertError } = await supabase.from('friendships').insert({
    user_low: normalizedPair[0],
    user_high: normalizedPair[1],
    status: 'pending',
    requested_by: currentUserId,
  });

  if (insertError) throw insertError;
  return { status: 'pending_outgoing' as const };
}

export async function respondToFriendshipRequest(currentUserId: string, targetId: string, accept: boolean) {
  const supabase = await createSupabaseServerClient();
  const normalizedPair = [currentUserId, targetId].sort();
  const { data: rows, error: lookupError } = await supabase
    .from('friendships')
    .select('id,status,user_low,user_high,requested_by')
    .eq('status', 'pending')
    .or(`user_low.eq.${normalizedPair[0]},user_high.eq.${normalizedPair[1]}`);

  if (lookupError) throw lookupError;

  const row = (rows ?? []).find((entry) => {
    const pair = [entry.user_low, entry.user_high].sort();
    return pair[0] === normalizedPair[0] && pair[1] === normalizedPair[1];
  });

  if (!row) throw new Error('Request not found');
  if (row.requested_by === currentUserId) throw new Error('Only the recipient can respond');

  if (!accept) {
    const { error: deleteError } = await supabase.from('friendships').delete().eq('id', row.id);
    if (deleteError) throw deleteError;
    return { status: 'rejected' as const };
  }

  const { error: updateError } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', row.id);
  if (updateError) throw updateError;
  return { status: 'accepted' as const };
}

export async function removeFriendship(currentUserId: string, targetId: string) {
  const supabase = await createSupabaseServerClient();
  const normalizedPair = [currentUserId, targetId].sort();
  const { data: rows, error: lookupError } = await supabase
    .from('friendships')
    .select('id,user_low,user_high,status')
    .eq('status', 'accepted')
    .or(`user_low.eq.${currentUserId},user_high.eq.${currentUserId}`);

  if (lookupError) throw lookupError;

  const row = (rows ?? []).find((entry) => {
    const pair = [entry.user_low, entry.user_high].sort();
    return pair[0] === normalizedPair[0] && pair[1] === normalizedPair[1];
  });

  if (!row) throw new Error('Friendship not found');

  const { error: deleteError } = await supabase.from('friendships').delete().eq('id', row.id);
  if (deleteError) throw deleteError;

  return { status: 'removed' as const };
}
