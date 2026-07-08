-- Phase 4.3: RPC Function attack_boss
-- Atomically handles boss attack: damage calc, storage, defeat check, rewards

CREATE OR REPLACE FUNCTION public.attack_boss(
  p_guild_id uuid,
  p_mission_score integer,
  p_user_role text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_today date;
  v_week_start date;
  v_day_of_week integer;
  v_is_weekend boolean;
  v_force_weekend boolean;
  v_guild_member_count integer;
  v_user_guild_role text;
  
  -- Boss fight data
  v_boss_fight_id uuid;
  v_boss_key text;
  v_boss_rarity integer;
  v_boss_max_hp integer;
  v_current_damage integer;
  v_fight_status text;
  
  -- Damage calculation
  v_base_damage numeric;
  v_role_multiplier numeric;
  v_final_damage integer;
  v_damage_config jsonb;
  
  -- New state after attack
  v_new_total_damage integer;
  v_is_defeated boolean;
  v_defeated_at timestamptz;
  
  -- Result
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  -- =====================================================
  -- 1. VALIDATION CHECKS
  -- =====================================================
  
  -- Check: User is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check: User is member of guild
  SELECT COUNT(*) INTO v_guild_member_count
  FROM public.guild_members
  WHERE guild_id = p_guild_id AND user_id = v_user_id;
  
  IF v_guild_member_count = 0 THEN
    RAISE EXCEPTION 'User not member of this guild';
  END IF;
  
  -- Check: Mission score valid (0-100)
  IF p_mission_score < 0 OR p_mission_score > 100 THEN
    RAISE EXCEPTION 'Invalid mission score (must be 0-100)';
  END IF;
  
  -- Check: User role valid
  IF p_user_role NOT IN ('leader', 'royal_knight', 'wizard', 'member') THEN
    RAISE EXCEPTION 'Invalid user role';
  END IF;
  
  -- Check: Is boss weekend (Saturday=6, Sunday=0 in UTC)
  -- OR if force_weekend_testing is enabled in boss_config
  v_today := CURRENT_DATE AT TIME ZONE 'UTC';
  v_day_of_week := EXTRACT(ISODOW FROM v_today);
  
  -- Read force_weekend_testing flag from config
  SELECT force_weekend_testing INTO v_force_weekend FROM public.boss_config LIMIT 1;
  v_force_weekend := COALESCE(v_force_weekend, false);
  
  v_is_weekend := v_day_of_week IN (0, 6) OR v_force_weekend;
  
  IF NOT v_is_weekend THEN
    RAISE EXCEPTION 'Boss fights only available on weekends (Sat-Sun UTC)';
  END IF;
  
  -- =====================================================
  -- 2. CALCULATE WEEK START (Monday)
  -- =====================================================
  v_week_start := v_today - ((EXTRACT(ISODOW FROM v_today)::integer - 1) % 7) * INTERVAL '1 day';
  
  -- =====================================================
  -- 3. GET OR CREATE BOSS FIGHT (Auto-create)
  -- =====================================================
  
  -- Try to get existing boss_fight for this guild+week
  SELECT id, boss_key, boss_rarity, boss_max_hp, damage_dealt, status
  INTO v_boss_fight_id, v_boss_key, v_boss_rarity, v_boss_max_hp, v_current_damage, v_fight_status
  FROM public.boss_fights
  WHERE guild_id = p_guild_id 
    AND week_start = v_week_start
  LIMIT 1;
  
  -- If no fight exists, create one automatically
  IF v_boss_fight_id IS NULL THEN
    -- Deterministic boss selection: MD5(weekStart) - GLOBAL for all guilds
    -- Maps hash to one of 18 bosses using weighted selection
    DECLARE
      v_seed text := v_week_start::text;
      v_hash text := md5(v_seed);
      v_seed_num bigint := ('x' || substring(v_hash, 1, 8))::bit(32)::bigint;
      v_selected_boss text;
      v_selected_rarity integer;
      v_selected_hp integer;
    BEGIN
      -- Deterministic boss weights (must match src/lib/boss.ts BOSS_TYPES)
      -- Total weight: 196 (cumulative)
      -- Selection: use modulo to pick boss
      v_selected_boss := CASE
        WHEN (v_seed_num % 196) < 1 THEN 'drago_bianco'
        WHEN (v_seed_num % 196) < 2 THEN 'drago_nero'
        WHEN (v_seed_num % 196) < 3 THEN 'drago_rosso'
        WHEN (v_seed_num % 196) < 5 THEN 'drago_verde'
        WHEN (v_seed_num % 196) < 7 THEN 'drago_comune'
        WHEN (v_seed_num % 196) < 9 THEN 'kraken'
        WHEN (v_seed_num % 196) < 12 THEN 'leviatano'
        WHEN (v_seed_num % 196) < 17 THEN 'idra'
        WHEN (v_seed_num % 196) < 24 THEN 'fenice'
        WHEN (v_seed_num % 196) < 33 THEN 'basilisco'
        WHEN (v_seed_num % 196) < 43 THEN 'gigante'
        WHEN (v_seed_num % 196) < 55 THEN 'grifone'
        WHEN (v_seed_num % 196) < 69 THEN 'ippogrifo'
        WHEN (v_seed_num % 196) < 85 THEN 'lupo_mannaro'
        WHEN (v_seed_num % 196) < 104 THEN 'minotauro'
        WHEN (v_seed_num % 196) < 126 THEN 'gnomo'
        WHEN (v_seed_num % 196) < 150 THEN 'goblin'
        ELSE 'fata'
      END;
      
      -- Map boss to rarity and HP (must match src/lib/boss.ts)
      SELECT rarity, hp INTO v_selected_rarity, v_selected_hp FROM (
        SELECT 5 as rarity, 2200 as hp WHERE 'drago_bianco' = v_selected_boss
        UNION SELECT 5, 2150 WHERE 'drago_nero' = v_selected_boss
        UNION SELECT 5, 2000 WHERE 'drago_rosso' = v_selected_boss
        UNION SELECT 5, 1900 WHERE 'drago_verde' = v_selected_boss
        UNION SELECT 5, 1700 WHERE 'drago_comune' = v_selected_boss
        UNION SELECT 5, 1800 WHERE 'kraken' = v_selected_boss
        UNION SELECT 5, 1600 WHERE 'leviatano' = v_selected_boss
        UNION SELECT 4, 1400 WHERE 'idra' = v_selected_boss
        UNION SELECT 4, 1250 WHERE 'fenice' = v_selected_boss
        UNION SELECT 4, 1150 WHERE 'basilisco' = v_selected_boss
        UNION SELECT 3, 1000 WHERE 'gigante' = v_selected_boss
        UNION SELECT 3, 850 WHERE 'grifone' = v_selected_boss
        UNION SELECT 3, 750 WHERE 'ippogrifo' = v_selected_boss
        UNION SELECT 2, 700 WHERE 'lupo_mannaro' = v_selected_boss
        UNION SELECT 2, 650 WHERE 'minotauro' = v_selected_boss
        UNION SELECT 2, 550 WHERE 'gnomo' = v_selected_boss
        UNION SELECT 1, 550 WHERE 'goblin' = v_selected_boss
        UNION SELECT 1, 450 WHERE 'fata' = v_selected_boss
      ) AS boss_map LIMIT 1;
      
      -- Create the boss_fight record
      INSERT INTO public.boss_fights (
        guild_id,
        week_start,
        boss_key,
        boss_rarity,
        boss_max_hp,
        damage_dealt,
        status
      ) VALUES (
        p_guild_id,
        v_week_start,
        v_selected_boss,
        v_selected_rarity,
        v_selected_hp,
        0,
        'active'
      ) RETURNING id, boss_key, boss_rarity, boss_max_hp, damage_dealt, status
      INTO v_boss_fight_id, v_boss_key, v_boss_rarity, v_boss_max_hp, v_current_damage, v_fight_status;
    END;
  END IF;
  
  -- Check: Fight is still active
  IF v_fight_status != 'active' THEN
    RAISE EXCEPTION 'Boss fight is not active (status: %)', v_fight_status;
  END IF;
  
  -- =====================================================
  -- 4. CALCULATE DAMAGE
  -- =====================================================
  -- Damage formula: score * 1.5 * roleMultiplier
  v_damage_config := jsonb_build_object(
    'base_multiplier', 1.5,
    'role_multipliers', jsonb_build_object(
      'leader', 1.0,
      'royal_knight', 1.2,
      'wizard', 1.5,
      'member', 1.0
    )
  );
  
  v_base_damage := p_mission_score * 1.5;
  v_role_multiplier := COALESCE(
    (v_damage_config -> 'role_multipliers' ->> p_user_role)::numeric,
    1.0
  );
  v_final_damage := FLOOR(v_base_damage * v_role_multiplier)::integer;
  
  -- =====================================================
  -- 5. INSERT BOSS ATTEMPT (UNIQUE constraint enforced)
  -- =====================================================
  -- This will fail if user already attacked this boss this week
  BEGIN
    INSERT INTO public.boss_attempts (
      boss_fight_id,
      user_id,
      damage,
      role_snapshot
    ) VALUES (
      v_boss_fight_id,
      v_user_id,
      v_final_damage,
      p_user_role
    );
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'User has already attacked this boss this week';
  END;
  
  -- =====================================================
  -- 6. UPDATE BOSS FIGHT DAMAGE
  -- =====================================================
  v_new_total_damage := v_current_damage + v_final_damage;
  v_is_defeated := v_new_total_damage >= v_boss_max_hp;
  
  IF v_is_defeated THEN
    v_defeated_at := now();
    UPDATE public.boss_fights
    SET damage_dealt = v_new_total_damage,
        status = 'defeated',
        defeated_at = v_defeated_at
    WHERE id = v_boss_fight_id;
  ELSE
    UPDATE public.boss_fights
    SET damage_dealt = v_new_total_damage
    WHERE id = v_boss_fight_id;
  END IF;
  
  -- =====================================================
  -- 7. DISTRIBUTE REWARDS (if defeated)
  -- =====================================================
  IF v_is_defeated THEN
    -- Guild reward: boss_rarity * 75 XP
    UPDATE public.guilds
    SET xp = COALESCE(xp, 0) + (v_boss_rarity * 75)
    WHERE id = p_guild_id;
    
    -- User reward: floor((user_damage * boss_rarity) / 10) XP
    UPDATE public.profiles
    SET xp = COALESCE(xp, 0) + FLOOR((v_final_damage::numeric * v_boss_rarity) / 10)::integer
    WHERE id = v_user_id;
    
    -- TODO: Assign badge to all guild members who participated
    -- (Phase 4.7-4.8)
  END IF;
  
  -- =====================================================
  -- 8. BUILD RESPONSE
  -- =====================================================
  v_result := jsonb_build_object(
    'success', true,
    'attack', jsonb_build_object(
      'mission_score', p_mission_score,
      'user_role', p_user_role,
      'damage_dealt', v_final_damage,
      'calculation', jsonb_build_object(
        'base_damage', v_base_damage,
        'role_multiplier', v_role_multiplier,
        'formula', 'floor(score * 1.5 * roleMultiplier)'
      )
    ),
    'boss_state', jsonb_build_object(
      'boss_key', v_boss_key,
      'boss_rarity', v_boss_rarity,
      'max_hp', v_boss_max_hp,
      'current_hp', GREATEST(0, v_boss_max_hp - v_new_total_damage),
      'total_damage', v_new_total_damage,
      'is_defeated', v_is_defeated
    ),
    'rewards', CASE WHEN v_is_defeated THEN jsonb_build_object(
      'guild_xp', v_boss_rarity * 75,
      'user_xp', FLOOR((v_final_damage::numeric * v_boss_rarity) / 10)::integer,
      'message', 'Boss defeated! Rewards distributed.'
    ) ELSE jsonb_build_object(
      'message', 'Keep attacking! Boss still alive.'
    ) END
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error as jsonb
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.attack_boss(uuid, integer, text) 
  TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.attack_boss IS 
'Atomically process a boss attack: validate, calculate damage, store attempt, update fight state, and distribute rewards if defeated. Returns jsonb with attack/boss/reward details.';
