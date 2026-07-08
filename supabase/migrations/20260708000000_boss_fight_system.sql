-- Boss Fight System - Phase 4.2 Migration
-- Creates tables for tracking boss weekend battles and member attacks

-- ============================================================================
-- TABLE: boss_fights
-- ============================================================================
-- Tracks the active/completed boss fight for each guild per weekend
CREATE TABLE IF NOT EXISTS boss_fights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  
  -- Week tracking (Monday of the week, YYYY-MM-DD format)
  week_start date NOT NULL,
  
  -- Boss details (snapshot from BOSS_TYPES)
  boss_key text NOT NULL,           -- e.g., 'drago_bianco', 'goblin'
  boss_rarity integer NOT NULL,     -- 1-5 stars
  boss_max_hp integer NOT NULL,     -- from BOSS_TYPES.hp
  
  -- Fight state
  damage_dealt integer NOT NULL DEFAULT 0,  -- cumulative damage from all attempts
  status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'defeated', 'timeout')),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  defeated_at timestamptz,  -- null until defeated
  
  -- Constraints
  UNIQUE(guild_id, week_start)
);

-- Index for fast lookups by guild
CREATE INDEX IF NOT EXISTS idx_boss_fights_guild_id 
  ON boss_fights(guild_id);

-- Index for active bosses (for weekend batch queries)
CREATE INDEX IF NOT EXISTS idx_boss_fights_status_week 
  ON boss_fights(status, week_start DESC);

-- ============================================================================
-- TABLE: boss_attempts
-- ============================================================================
-- Tracks individual attack attempts by members on a boss fight
CREATE TABLE IF NOT EXISTS boss_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  boss_fight_id uuid NOT NULL REFERENCES boss_fights(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Damage info
  damage integer NOT NULL,  -- calculated from mission score + role multiplier
  role_snapshot text NOT NULL DEFAULT 'member'
    CHECK (role_snapshot IN ('leader', 'royal_knight', 'wizard', 'member')),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints: One attempt per user per boss fight
  UNIQUE(boss_fight_id, user_id)
);

-- Index for fast lookups by boss fight
CREATE INDEX IF NOT EXISTS idx_boss_attempts_boss_fight_id 
  ON boss_attempts(boss_fight_id);

-- Index for user damage history
CREATE INDEX IF NOT EXISTS idx_boss_attempts_user_id 
  ON boss_attempts(user_id, created_at DESC);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) - boss_fights
-- ============================================================================
-- Users can only see boss fights for guilds they are members of

ALTER TABLE boss_fights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT boss fights for their guilds
CREATE POLICY rls_boss_fights_select ON boss_fights
  FOR SELECT
  USING (
    guild_id IN (
      SELECT id FROM public.guilds
      WHERE founder_id = auth.uid()
      UNION
      SELECT guild_id FROM public.guild_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can INSERT (via RPC)
CREATE POLICY rls_boss_fights_insert ON boss_fights
  FOR INSERT
  WITH CHECK (
    -- Only guild owner/members can create fights (via RPC validation)
    guild_id IN (
      SELECT id FROM public.guilds
      WHERE founder_id = auth.uid()
      UNION
      SELECT guild_id FROM public.guild_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can UPDATE damage/status
CREATE POLICY rls_boss_fights_update ON boss_fights
  FOR UPDATE
  USING (
    guild_id IN (
      SELECT id FROM public.guilds
      WHERE founder_id = auth.uid()
      UNION
      SELECT guild_id FROM public.guild_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    guild_id IN (
      SELECT id FROM public.guilds
      WHERE founder_id = auth.uid()
      UNION
      SELECT guild_id FROM public.guild_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) - boss_attempts
-- ============================================================================
-- Users can only see attempts for boss fights in their guilds

ALTER TABLE boss_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT attempts for their guild's boss fights
CREATE POLICY rls_boss_attempts_select ON boss_attempts
  FOR SELECT
  USING (
    boss_fight_id IN (
      SELECT id FROM boss_fights
      WHERE guild_id IN (
        SELECT id FROM public.guilds
        WHERE founder_id = auth.uid()
        UNION
        SELECT guild_id FROM public.guild_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can INSERT their own attempts (via RPC)
CREATE POLICY rls_boss_attempts_insert ON boss_attempts
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND boss_fight_id IN (
      SELECT id FROM boss_fights
      WHERE guild_id IN (
        SELECT id FROM public.guilds
        WHERE founder_id = auth.uid()
        UNION
        SELECT guild_id FROM public.guild_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamp on boss_fights modification

CREATE OR REPLACE FUNCTION update_boss_fights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_boss_fights_updated_at
  BEFORE UPDATE ON boss_fights
  FOR EACH ROW
  EXECUTE FUNCTION update_boss_fights_timestamp();

-- ============================================================================
-- NOTES
-- ============================================================================
/*
After running this migration:

1. Verify table creation:
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name IN ('boss_fights', 'boss_attempts');

2. Test RLS policies are active:
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' AND tablename IN ('boss_fights', 'boss_attempts');

3. Next steps (Phase 4.3):
   - Create RPC function: attack_boss(guild_id, mission_score, user_role)
   - Atomically:
     * Verify session + guild membership
     * Calculate damage
     * Create/update boss_fights record
     * Insert boss_attempts record
     * Check if defeated, distribute rewards

4. Dependencies:
   - Expects tables: public.guilds, public.profiles, public.guild_members
   - Expects column: guilds.founder_id, guild_members.user_id
   - Uses Supabase auth.uid() for current user context
*/
