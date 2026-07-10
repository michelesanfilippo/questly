import type { SupabaseProfile } from '@/types';

export const MAX_FRIENDS = 20;
export const MAX_GUILD_MEMBERS = 12;
export const GUILD_UNLOCK_LEVEL = 5;

export function canJoinOrCreateGuild(p: SupabaseProfile): boolean {
  return p.level >= GUILD_UNLOCK_LEVEL;
}
