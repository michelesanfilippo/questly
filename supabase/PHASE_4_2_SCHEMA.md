# Phase 4.2: Boss Fight Database Schema

## Overview
Creates two tables for the Boss Weekend system:
- **boss_fights**: Tracks guild vs boss combat state (one per guild per week)
- **boss_attempts**: Tracks individual member attacks on that boss

## Tables

### boss_fights
```
id (uuid, PK)           - Fight record identifier
guild_id (uuid, FK)     - Reference to guilds table
week_start (date)       - Monday of week (YYYY-MM-DD), deterministic key
boss_key (text)         - Boss identifier ('drago_bianco', 'goblin', etc)
boss_rarity (int)       - Boss rarity 1-5 (for loot/XP calculations)
boss_max_hp (int)       - Total boss HP (from BOSS_TYPES)
damage_dealt (int)      - Cumulative damage from all attempts
status (text)           - 'active' | 'defeated' | 'timeout'
created_at (timestamptz)
updated_at (timestamptz) - Auto-updated on any change
defeated_at (timestamptz) - Null until boss is defeated
```

**Constraints:**
- UNIQUE(guild_id, week_start) — One boss fight per guild per week
- Cascading delete when guild is removed

**Indices:**
- idx_boss_fights_guild_id — Fast guild lookups
- idx_boss_fights_status_week — Find active bosses across all guilds

### boss_attempts
```
id (uuid, PK)           - Attempt record identifier
boss_fight_id (uuid, FK) - Reference to boss_fights
user_id (uuid, FK)      - Reference to profiles
damage (int)            - Damage dealt by this user
role_snapshot (text)    - User's role at time of attack
created_at (timestamptz)
```

**Constraints:**
- UNIQUE(boss_fight_id, user_id) — One attempt per user per boss
- Cascading delete when user/fight removed

**Indices:**
- idx_boss_attempts_boss_fight_id — Fast fight detail queries
- idx_boss_attempts_user_id — User damage history

## Row-Level Security (RLS)

### boss_fights RLS
✅ **SELECT**: User can see boss fights for guilds they own or belong to  
✅ **INSERT**: User can create fights for their guilds (via API/RPC)  
✅ **UPDATE**: User can modify fights for their guilds (damage updates via RPC)

### boss_attempts RLS
✅ **SELECT**: User can see attempts for their guild's boss fights  
✅ **INSERT**: User can record their own attempts (enforced by user_id = auth.uid())

## Execution

### Option A: Supabase CLI
```bash
cd /workspaces/questly
supabase db push
```

### Option B: Supabase Dashboard
1. Go to SQL Editor in Supabase dashboard
2. Create new query
3. Copy entire contents of `20260708000000_boss_fight_system.sql`
4. Execute

### Option C: Verify with psql
```bash
psql $DATABASE_URL < supabase/migrations/20260708000000_boss_fight_system.sql
```

## Verification

After migration, run these checks:

```sql
-- 1. Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('boss_fights', 'boss_attempts');

-- 2. Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('boss_fights', 'boss_attempts');

-- 3. Verify indices created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('boss_fights', 'boss_attempts');

-- 4. List RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Dependencies

This migration expects:
- ✅ `public.guilds` table with `id` and `owner_id` columns
- ✅ `public.profiles` table with `id` column  
- ✅ `public.guild_members` table with `guild_id` and `user_id` columns
- ✅ `auth.uid()` Supabase auth function available

## Next Steps

**Phase 4.3**: Create RPC function `attack_boss()`
- Validates session + guild membership + weekend window
- Calculates damage from mission score + role
- Atomically updates damage and creates attempt record
- Checks if boss defeated, distributes rewards

**Phase 4.4**: POST `/api/boss/attack` endpoint
- Calls evaluation function (to validate mission)
- Invokes `attack_boss()` RPC
- Returns boss HP state + damage feedback

**Phase 4.5+**: UI Components + Integration
