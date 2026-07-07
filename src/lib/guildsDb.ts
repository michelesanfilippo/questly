import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { GUILD_UNLOCK_LEVEL } from '@/lib/gating';

export async function getCurrentGuild(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: membershipRows, error: membershipError } = await supabase
    .from('guild_members')
    .select('guild_id,role')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membershipRows?.guild_id) return null;

  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('id,name,level,xp,founder_id,created_at')
    .eq('id', membershipRows.guild_id)
    .single();

  if (guildError) throw guildError;

  const { data: memberRows, error: memberError } = await supabase
    .from('guild_members')
    .select('user_id,role')
    .eq('guild_id', membershipRows.guild_id);

  if (memberError) throw memberError;

  const memberIds = (memberRows ?? []).map((member) => member.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id,nickname')
    .in('id', memberIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.nickname]));
  const members = (memberRows ?? []).map((member) => ({
    user_id: member.user_id,
    role: member.role,
    nickname: profileMap.get(member.user_id) ?? null,
  }));

  return { guild, role: membershipRows.role, members };
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

  return {
    guilds: data ?? [],
    membership: membershipRows ?? [],
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
