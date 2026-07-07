import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { GUILD_UNLOCK_LEVEL } from '@/lib/gating';

export async function getCurrentGuild(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: membershipRows, error: membershipError } = await supabase
    .from('guild_members')
    .select('guild_id,role')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    console.error('[guildsDb.getCurrentGuild] membership error:', membershipError);
    throw membershipError;
  }
  if (!membershipRows?.guild_id) return null;

  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('id,name,level,xp,founder_id,created_at')
    .eq('id', membershipRows.guild_id)
    .single();

  if (guildError) {
    console.error('[guildsDb.getCurrentGuild] guild error:', guildError);
    throw guildError;
  }

  const { data: memberRows, error: memberError } = await supabase
    .from('guild_members')
    .select('user_id,role')
    .eq('guild_id', membershipRows.guild_id);

  if (memberError) {
    console.error('[guildsDb.getCurrentGuild] members error:', memberError);
    throw memberError;
  }

  const memberIds = (memberRows ?? []).map((member) => member.user_id);

  if (memberIds.length === 0) {
    let requestCount = 0;
    if (['leader', 'royal_knight', 'wizard'].includes(membershipRows.role)) {
      try {
        const { count } = await supabase.from('guild_requests').select('*', { count: 'exact', head: true }).eq('guild_id', membershipRows.guild_id);
        requestCount = count ?? 0;
      } catch { /* table may not exist yet */ }
    }
    return { guild, role: membershipRows.role, members: [], requestCount };
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id,nickname,profile_badge_index')
    .in('id', memberIds);

  if (profileError) {
    console.error('[guildsDb.getCurrentGuild] profiles error:', profileError);
    throw profileError;
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, { nickname: profile.nickname, profile_badge_index: profile.profile_badge_index as number | null }]));
  const members = (memberRows ?? []).map((member) => ({
    user_id: member.user_id,
    role: member.role,
    nickname: profileMap.get(member.user_id)?.nickname ?? null,
    profile_badge_index: profileMap.get(member.user_id)?.profile_badge_index ?? null,
  }));

  let requestCount = 0;
  if (['leader', 'royal_knight', 'wizard'].includes(membershipRows.role)) {
    try {
      const { count } = await supabase.from('guild_requests').select('*', { count: 'exact', head: true }).eq('guild_id', membershipRows.guild_id);
      requestCount = count ?? 0;
    } catch { /* table may not exist yet */ }
  }
  return { guild, role: membershipRows.role, members, requestCount };
}

export async function leaveGuildRecord(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: membership, error: membershipError } = await supabase
    .from('guild_members').select('guild_id,role').eq('user_id', userId).maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership?.guild_id) throw new Error('Not a member of any guild');

  const guildId = membership.guild_id;

  if (membership.role === 'leader') {
    // Dissolve guild: clear guild_id for all members, then delete guild (cascade handles guild_members/guild_requests)
    const { data: memberRows } = await supabase.from('guild_members').select('user_id').eq('guild_id', guildId);
    const memberIds = (memberRows ?? []).map((m) => m.user_id);
    if (memberIds.length > 0) {
      await supabase.from('profiles').update({ guild_id: null }).in('id', memberIds);
    }
    const { error: deleteError } = await supabase.from('guilds').delete().eq('id', guildId);
    if (deleteError) throw deleteError;
  } else {
    const { error: memberError } = await supabase.from('guild_members').delete().eq('user_id', userId).eq('guild_id', guildId);
    if (memberError) throw memberError;
    const { error: profileError } = await supabase.from('profiles').update({ guild_id: null }).eq('id', userId);
    if (profileError) throw profileError;
  }

  const { data: updatedProfile, error: updatedProfileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (updatedProfileError) throw updatedProfileError;
  return { profile: updatedProfile };
}

export async function listGuilds(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('guilds')
    .select('id,name,description,level,xp,founder_id,created_at')
    .order('level', { ascending: false })
    .order('xp', { ascending: false });

  if (error) throw error;

  const { data: membershipRows, error: membershipError } = await supabase
    .from('guild_members')
    .select('guild_id,user_id,role')
    .eq('user_id', userId);

  if (membershipError) throw membershipError;

  let pendingRequestGuildIds: string[] = [];
  try {
    const { data: requestRows } = await supabase.from('guild_requests').select('guild_id').eq('user_id', userId);
    pendingRequestGuildIds = (requestRows ?? []).map((r) => r.guild_id as string);
  } catch { /* table may not exist yet */ }

  return {
    guilds: data ?? [],
    membership: membershipRows ?? [],
    pendingRequestGuildIds,
  };
}

export async function createGuildRecord(userId: string, name: string, description?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id,level,guild_id').eq('id', userId).single();
  if (profileError) throw profileError;
  if (!profile) throw new Error('Profile not found');
  if ((profile.level ?? 0) < GUILD_UNLOCK_LEVEL) throw new Error('Guilds unlock at level 6');
  if (profile.guild_id) throw new Error('User already belongs to a guild');

  const trimmedName = name.trim();
  const { data: existingGuild, error: existingGuildError } = await supabase
    .from('guilds')
    .select('id')
    .ilike('name', trimmedName)
    .maybeSingle();

  if (existingGuildError) throw existingGuildError;
  if (existingGuild) throw new Error('Guild name already exists');

  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .insert({ name: trimmedName, description: description?.trim() || null, founder_id: userId, level: 1, xp: 0 })
    .select('id,name,description,level,xp,founder_id,created_at')
    .single();

  if (guildError) throw guildError;

  const { error: memberError } = await supabase.from('guild_members').insert({ guild_id: guild.id, user_id: userId, role: 'leader' });
  if (memberError) throw memberError;

  const { error: profileUpdateError } = await supabase.from('profiles').update({ guild_id: guild.id }).eq('id', userId);
  if (profileUpdateError) throw profileUpdateError;

  const { data: updatedProfile, error: updatedProfileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (updatedProfileError) throw updatedProfileError;

  return { guild, profile: updatedProfile };
}

export async function joinGuildRecord(userId: string, guildId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id,level,guild_id').eq('id', userId).single();
  if (profileError) throw profileError;
  if (!profile) throw new Error('Profile not found');
  if ((profile.level ?? 0) < GUILD_UNLOCK_LEVEL) throw new Error('Guilds unlock at level 6');
  if (profile.guild_id) throw new Error('User already belongs to a guild');

  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('id,name,level,xp,founder_id,created_at')
    .eq('id', guildId)
    .single();

  if (guildError) throw guildError;

  const { error: memberError } = await supabase.from('guild_members').insert({ guild_id: guild.id, user_id: userId, role: 'member' });
  if (memberError) throw memberError;

  const { error: profileUpdateError } = await supabase.from('profiles').update({ guild_id: guild.id }).eq('id', userId);
  if (profileUpdateError) throw profileUpdateError;

  const { data: updatedProfile, error: updatedProfileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (updatedProfileError) throw updatedProfileError;

  return { guild, profile: updatedProfile };
}

export async function applyToGuildRecord(userId: string, guildId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id,level,guild_id').eq('id', userId).single();
  if (profileError) throw profileError;
  if (!profile) throw new Error('Profile not found');
  if ((profile.level ?? 0) < GUILD_UNLOCK_LEVEL) throw new Error('Guilds unlock at level 6');
  if (profile.guild_id) throw new Error('Already in a guild');

  const { data: guild, error: guildError } = await supabase.from('guilds').select('id').eq('id', guildId).maybeSingle();
  if (guildError) throw guildError;
  if (!guild) throw new Error('Guild not found');

  const { data: existing } = await supabase.from('guild_requests').select('id').eq('guild_id', guildId).eq('user_id', userId).maybeSingle();
  if (existing) throw new Error('Request already sent');

  const { error } = await supabase.from('guild_requests').insert({ guild_id: guildId, user_id: userId });
  if (error) throw error;

  return { applied: true };
}

export async function kickMemberRecord(actorId: string, targetUserId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: actorMembership } = await supabase.from('guild_members').select('guild_id,role').eq('user_id', actorId).maybeSingle();
  if (!actorMembership?.guild_id) throw new Error('Actor not in a guild');
  if (!['leader', 'royal_knight', 'wizard'].includes(actorMembership.role)) throw new Error('Insufficient permissions');

  const { data: targetMembership } = await supabase.from('guild_members').select('guild_id,role').eq('user_id', targetUserId).maybeSingle();
  if (!targetMembership || targetMembership.guild_id !== actorMembership.guild_id) throw new Error('Target not in the same guild');
  if (targetMembership.role === 'leader') throw new Error('Cannot kick the leader');
  if (actorMembership.role !== 'leader' && targetMembership.role !== 'member') throw new Error('Can only kick regular members');

  const { error: memberError } = await supabase.from('guild_members').delete().eq('user_id', targetUserId).eq('guild_id', actorMembership.guild_id);
  if (memberError) throw memberError;
  const { error: profileError } = await supabase.from('profiles').update({ guild_id: null }).eq('id', targetUserId);
  if (profileError) throw profileError;

  return { kicked: true };
}

export async function assignRoleRecord(
  actorId: string,
  targetUserId: string,
  role: 'royal_knight' | 'wizard' | 'member',
  demoteUserId?: string,
) {
  const supabase = await createSupabaseServerClient();

  const { data: actorMembership } = await supabase.from('guild_members').select('guild_id,role').eq('user_id', actorId).maybeSingle();
  if (!actorMembership?.guild_id) throw new Error('Actor not in a guild');
  if (actorMembership.role !== 'leader') throw new Error('Only the leader can assign roles');

  const guildId = actorMembership.guild_id;
  const { data: targetMembership } = await supabase.from('guild_members').select('guild_id,role').eq('user_id', targetUserId).maybeSingle();
  if (!targetMembership || targetMembership.guild_id !== guildId) throw new Error('Target not in the same guild');
  if (targetMembership.role === 'leader') throw new Error('Cannot change leader role');

  if (role === 'royal_knight') {
    const { data: knights } = await supabase.from('guild_members').select('user_id').eq('guild_id', guildId).eq('role', 'royal_knight');
    const currentKnights = knights ?? [];
    if (targetMembership.role === 'royal_knight') {
      await supabase.from('guild_members').update({ role: 'member' }).eq('user_id', targetUserId).eq('guild_id', guildId);
    } else if (currentKnights.length < 2) {
      await supabase.from('guild_members').update({ role: 'royal_knight' }).eq('user_id', targetUserId).eq('guild_id', guildId);
    } else if (demoteUserId) {
      await supabase.from('guild_members').update({ role: 'member' }).eq('user_id', demoteUserId).eq('guild_id', guildId);
      await supabase.from('guild_members').update({ role: 'royal_knight' }).eq('user_id', targetUserId).eq('guild_id', guildId);
    } else {
      const holderIds = currentKnights.map((k) => k.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id,nickname,profile_badge_index').in('id', holderIds);
      return { needsDemote: true, role: 'royal_knight', holders: profiles ?? [] };
    }
  } else if (role === 'wizard') {
    const { data: wizards } = await supabase.from('guild_members').select('user_id').eq('guild_id', guildId).eq('role', 'wizard');
    const currentWizards = wizards ?? [];
    if (targetMembership.role === 'wizard') {
      await supabase.from('guild_members').update({ role: 'member' }).eq('user_id', targetUserId).eq('guild_id', guildId);
    } else if (currentWizards.length < 1) {
      await supabase.from('guild_members').update({ role: 'wizard' }).eq('user_id', targetUserId).eq('guild_id', guildId);
    } else if (demoteUserId) {
      await supabase.from('guild_members').update({ role: 'member' }).eq('user_id', demoteUserId).eq('guild_id', guildId);
      await supabase.from('guild_members').update({ role: 'wizard' }).eq('user_id', targetUserId).eq('guild_id', guildId);
    } else {
      const holderIds = currentWizards.map((w) => w.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id,nickname,profile_badge_index').in('id', holderIds);
      return { needsDemote: true, role: 'wizard', holders: profiles ?? [] };
    }
  } else {
    await supabase.from('guild_members').update({ role: 'member' }).eq('user_id', targetUserId).eq('guild_id', guildId);
  }

  return { assigned: true };
}

export async function listJoinRequestsRecord(actorId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: membership } = await supabase.from('guild_members').select('guild_id,role').eq('user_id', actorId).maybeSingle();
  if (!membership?.guild_id) throw new Error('Not in a guild');
  if (!['leader', 'royal_knight', 'wizard'].includes(membership.role)) throw new Error('Insufficient permissions');

  const { data: requests, error } = await supabase.from('guild_requests').select('id,user_id,created_at').eq('guild_id', membership.guild_id).order('created_at');
  if (error) throw error;
  if (!requests || requests.length === 0) return { requests: [] };

  const userIds = requests.map((r) => r.user_id);
  const { data: profiles } = await supabase.from('profiles').select('id,nickname,profile_badge_index,level').in('id', userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return {
    requests: requests.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      created_at: r.created_at,
      nickname: profileMap.get(r.user_id)?.nickname ?? null,
      level: profileMap.get(r.user_id)?.level ?? null,
      profile_badge_index: (profileMap.get(r.user_id)?.profile_badge_index ?? null) as number | null,
    })),
  };
}

export async function respondJoinRequestRecord(actorId: string, requestId: string, accept: boolean) {
  const supabase = await createSupabaseServerClient();

  const { data: actorMembership } = await supabase.from('guild_members').select('guild_id,role').eq('user_id', actorId).maybeSingle();
  if (!actorMembership?.guild_id) throw new Error('Not in a guild');
  if (!['leader', 'royal_knight', 'wizard'].includes(actorMembership.role)) throw new Error('Insufficient permissions');

  const { data: request, error: requestError } = await supabase.from('guild_requests').select('id,guild_id,user_id').eq('id', requestId).maybeSingle();
  if (requestError) throw requestError;
  if (!request) throw new Error('Request not found');
  if (request.guild_id !== actorMembership.guild_id) throw new Error('Request not for this guild');

  if (accept) {
    const { data: requesterProfile } = await supabase.from('profiles').select('id,guild_id,level').eq('id', request.user_id).single();
    if (requesterProfile?.guild_id) throw new Error('User already joined another guild');
    if ((requesterProfile?.level ?? 0) < GUILD_UNLOCK_LEVEL) throw new Error('User level too low');

    const { error: memberError } = await supabase.from('guild_members').insert({ guild_id: request.guild_id, user_id: request.user_id, role: 'member' });
    if (memberError) throw memberError;
    const { error: profileError } = await supabase.from('profiles').update({ guild_id: request.guild_id }).eq('id', request.user_id);
    if (profileError) throw profileError;
  }

  const { error: deleteError } = await supabase.from('guild_requests').delete().eq('id', requestId);
  if (deleteError) throw deleteError;

  return { responded: true };
}
