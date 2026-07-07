import { GUILD_UNLOCK_LEVEL } from '@/lib/gating';
import type { SupabaseProfile } from '@/types';

export type GuildAccessState = 'logged_out' | 'locked' | 'ready' | 'member';

export function getGuildAccessState(profile: SupabaseProfile | null): GuildAccessState {
  if (!profile) return 'logged_out';
  if (profile.level < GUILD_UNLOCK_LEVEL) return 'locked';
  return profile.guild_id ? 'member' : 'ready';
}
