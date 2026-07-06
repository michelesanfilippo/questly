'use client';
import { supabase } from './supabase';

function oauthRedirect() {
  return typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '';
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: oauthRedirect() } });
}

export async function signInWithGitHub() {
  return supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: oauthRedirect() } });
}

export async function signInWithDiscord() {
  return supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: oauthRedirect() } });
}

export async function signInWithEmail(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: oauthRedirect() },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).single();
}

export async function createProfile(
  userId: string,
  nickname: string,
  email: string | null
) {
  return supabase.from('profiles').insert({
    id: userId,
    nickname,
    email,
    level: 1,
    xp: 0,
    missions_completed: 0,
  });
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();
  if (error) return false;
  return data === null;
}

export async function updateProfileXP(
  userId: string,
  xp: number,
  level: number,
  missions_completed: number,
  last_mission_id?: string,
  last_mission_date?: string,
  diffCounters?: { missions_diff2plus: number; missions_diff3plus: number; missions_diff4plus: number; missions_diff5: number }
) {
  return supabase
    .from('profiles')
    .update({
      xp,
      level,
      missions_completed,
      ...(last_mission_id ? { last_mission_id, last_mission_date } : {}),
      ...(diffCounters ?? {}),
    })
    .eq('id', userId);
}

export async function getNpcProgress(userId: string) {
  return supabase.from('quest_npc_progress').select('*').eq('user_id', userId);
}

export async function incrementNpcProgress(userId: string, npcSource: string) {
  return supabase.rpc('increment_npc_progress', { p_user_id: userId, p_npc_source: npcSource });
}

export async function setProfileBadge(userId: string, badgeIndex: number | null) {
  return supabase.from('profiles').update({ profile_badge_index: badgeIndex }).eq('id', userId);
}

export async function getUserBadges(userId: string) {
  return supabase
    .from('user_badges')
    .select('badge_index')
    .eq('user_id', userId);
}

export async function awardBadge(userId: string, badgeIndex: number) {
  return supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_index: badgeIndex });
}
