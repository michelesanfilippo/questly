-- Guilds core schema
CREATE TABLE IF NOT EXISTS guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  founder_id uuid NOT NULL,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guild_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, user_id)
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS guild_id uuid;

ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guilds' AND policyname = 'guilds_select_authenticated'
  ) THEN
    CREATE POLICY "guilds_select_authenticated" ON guilds
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guilds' AND policyname = 'guilds_insert_authenticated'
  ) THEN
    CREATE POLICY "guilds_insert_authenticated" ON guilds
      FOR INSERT TO authenticated WITH CHECK (founder_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guilds' AND policyname = 'guilds_update_founder'
  ) THEN
    CREATE POLICY "guilds_update_founder" ON guilds
      FOR UPDATE TO authenticated
      USING (founder_id = auth.uid())
      WITH CHECK (founder_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guild_members' AND policyname = 'guild_members_select_authenticated'
  ) THEN
    CREATE POLICY "guild_members_select_authenticated" ON guild_members
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guild_members' AND policyname = 'guild_members_insert_authenticated'
  ) THEN
    CREATE POLICY "guild_members_insert_authenticated" ON guild_members
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guild_members' AND policyname = 'guild_members_delete_authenticated'
  ) THEN
    CREATE POLICY "guild_members_delete_authenticated" ON guild_members
      FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_guilds_founder_id ON guilds(founder_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id);
