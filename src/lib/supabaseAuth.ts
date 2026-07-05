'use client';
import { supabase } from './supabase';

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:
        typeof window !== 'undefined'
          ? window.location.origin + '/auth/callback'
          : '',
    },
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
  missions_completed: number
) {
  return supabase
    .from('profiles')
    .update({ xp, level, missions_completed })
    .eq('id', userId);
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
