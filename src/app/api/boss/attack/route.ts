import { NextRequest, NextResponse } from 'next/server';
import { evaluateBossAnswer } from '@/lib/boss-evaluate';
import type { BossEvaluation } from '@/lib/boss-evaluate';
import { getWeekStart, pickBoss, calculateDamage } from '@/lib/boss';
import { requireUser, createSupabaseAdminClient } from '@/lib/supabaseServer';
import { checkAndAwardGuildBadges } from '@/lib/badges';
import bossMissionsData from '@/data/boss_missions.json';



/**
 * POST /api/boss/attack
 *
 * Processes a boss attack for the current authenticated user.
 *
 * Request body:
 * {
 *   guildId: string (uuid)
 *   userAnswer: string (the user's quest answer)
 *   bossKey: string (the boss key for getting quest context)
 *   userRole?: string ('leader' | 'royal_knight' | 'wizard' | 'member', default: 'member')
 * }
 *
 * Returns:
 * {
 *   success: boolean
 *   attack?: { mission_score, user_role, damage_dealt, score, calculation }
 *   boss_state?: { boss_key, boss_rarity, max_hp, current_hp, total_damage, is_defeated }
 *   rewards?: { guild_xp?, user_xp?, message }
 *   error?: string (if success=false)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // 1. AUTHENTICATE USER
    // =====================================================
    const auth = await requireUser(request);
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    // =====================================================
    // 2. VALIDATE REQUEST
    // =====================================================
    const body = await request.json();
    const { guildId, userAnswer, bossKey, userRole = 'member' } = body;

    if (!guildId || typeof guildId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid guildId' },
        { status: 400 }
      );
    }

    if (!userAnswer || typeof userAnswer !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid userAnswer' },
        { status: 400 }
      );
    }

    if (userAnswer.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Answer must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (!bossKey || typeof bossKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid bossKey' },
        { status: 400 }
      );
    }

    if (!['leader', 'royal_knight', 'wizard', 'member'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid userRole' },
        { status: 400 }
      );
    }

    // =====================================================
    // 3. GET ADMIN DB CLIENT
    // =====================================================
    const supabase = await createSupabaseAdminClient();

    // =====================================================
    // 4. VALIDATE BOSS + GUILD STATE (before AI call)
    // =====================================================
    const weekStartStr = getWeekStart();

    let { data: bossFight, error: bossFightError } = await supabase
      .from('boss_fights')
      .select('id, boss_key, boss_rarity, boss_max_hp')
      .eq('week_start', weekStartStr)
      .maybeSingle();

    if (!bossFight) {
      if (bossFightError) {
        console.error('[api/boss/attack] Error fetching boss fight:', bossFightError);
        return NextResponse.json({ success: false, error: 'Failed to fetch boss fight' }, { status: 500 });
      }
      const selectedBoss = pickBoss(weekStartStr);
      const { data: newBoss, error: createError } = await supabase
        .from('boss_fights')
        .insert({ week_start: weekStartStr, boss_key: selectedBoss.key, boss_rarity: selectedBoss.rarity, boss_max_hp: selectedBoss.hp, damage_dealt: 0, status: 'active' })
        .select('id, boss_key, boss_rarity, boss_max_hp')
        .single();
      if (createError) {
        console.error('[api/boss/attack] Failed to create boss fight:', createError);
        return NextResponse.json({ success: false, error: 'Failed to create boss fight' }, { status: 500 });
      }
      bossFight = newBoss;
    }

    if (!bossFight) {
      return NextResponse.json({ success: false, error: 'Boss fight initialization failed' }, { status: 500 });
    }

    let { data: guildState, error: guildStateError } = await supabase
      .from('boss_guild_state')
      .select('id, current_hp, total_damage, is_defeated')
      .eq('boss_fight_id', bossFight.id)
      .eq('guild_id', guildId)
      .maybeSingle();

    if (!guildState) {
      const { data: newState, error: createStateError } = await supabase
        .from('boss_guild_state')
        .insert({ boss_fight_id: bossFight.id, guild_id: guildId, current_hp: bossFight.boss_max_hp, total_damage: 0, is_defeated: false })
        .select('id, current_hp, total_damage, is_defeated')
        .single();
      if (createStateError) {
        console.error('[api/boss/attack] Failed to create guild state:', createStateError);
        return NextResponse.json({ success: false, error: 'Failed to initialize guild state' }, { status: 500 });
      }
      guildState = newState;
    }

    if (guildState?.is_defeated) {
      return NextResponse.json({ success: false, error: 'The boss has already been defeated by your guild this week' }, { status: 400 });
    }

    // =====================================================
    // 5. EVALUATE ANSWER WITH AI
    // =====================================================
    const evaluation = await evaluateBossAnswer(bossKey, `Defeat the ${bossKey}`, userAnswer);
    console.log(`[api/boss/attack] Evaluated score: ${evaluation.score} for user answer`);
    
    // Calculate damage for this attack
    const damageDealt = calculateDamage(evaluation.score, userRole as any);
    const newTotalDamage = (guildState?.total_damage || 0) + damageDealt;
    const newCurrentHp = Math.max(0, (guildState?.current_hp || bossFight.boss_max_hp) - damageDealt);
    const isDefeated = newCurrentHp <= 0;
    const justDefeated = isDefeated && !(guildState?.is_defeated);
    
    // Update guild state with new damage
    const { error: updateError } = await supabase
      .from('boss_guild_state')
      .update({
        current_hp: newCurrentHp,
        total_damage: newTotalDamage,
        is_defeated: isDefeated,
        updated_at: new Date().toISOString(),
      })
      .eq('boss_fight_id', bossFight.id)
      .eq('guild_id', guildId);
    
    if (updateError) {
      console.error('[api/boss/attack] Failed to update guild state:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update boss state' },
        { status: 500 }
      );
    }
    
    // Record attempt
    const { error: attemptError } = await supabase
      .from('boss_attempts')
      .insert({
        user_id: userId,
        guild_id: guildId,
        boss_fight_id: bossFight.id,
        damage: damageDealt,
        role_snapshot: userRole,
      });
    
    if (attemptError) {
      console.error('[api/boss/attack] Failed to record attempt:', attemptError);
      // Don't fail the whole request, attempt recording is secondary
    }

    // =====================================================
    // 6. AWARD XP ON BOSS DEFEAT
    //    - Guild: rarity * 75  (guild can level up)
    //    - Each member: rarity * 20  (personal XP with level-up)
    // =====================================================
    const guildXpReward = bossFight.boss_rarity * 75;
    const userXpReward = bossFight.boss_rarity * 20;

    let newGuildLevel = 1;
    let newGuildBadges: string[] = [];

    if (justDefeated) {
      try {
        // --- Guild XP ---
        const { data: guildRow } = await supabase
          .from('guilds')
          .select('xp, level')
          .eq('id', guildId)
          .single();

        if (guildRow) {
          let gXp = (guildRow.xp ?? 0) + guildXpReward;
          let gLevel = guildRow.level ?? 1;
          while (gXp >= gLevel * 100) {
            gXp -= gLevel * 100;
            gLevel++;
          }
          newGuildLevel = gLevel;
          await supabase
            .from('guilds')
            .update({ xp: gXp, level: gLevel })
            .eq('id', guildId);
        }

        // --- Member XP ---
        const { data: memberList } = await supabase
          .from('guild_members')
          .select('user_id')
          .eq('guild_id', guildId);

        const memberIds = (memberList ?? []).map((m: { user_id: string }) => m.user_id);

        if (memberIds.length > 0) {
          const { data: memberProfiles } = await supabase
            .from('profiles')
            .select('id, xp, level')
            .in('id', memberIds);

          if (memberProfiles) {
            await Promise.all(memberProfiles.map(async (prof) => {
              let xp = (prof.xp ?? 0) + userXpReward;
              let level = prof.level ?? 1;
              while (xp >= level * 100) { xp -= level * 100; level++; }
              await supabase.from('profiles').update({ xp, level }).eq('id', prof.id);
            }));
          }
        }
      } catch (xpErr) {
        console.error('[api/boss/attack] Failed to award XP on boss defeat:', xpErr);
        // Non-fatal: don't fail the attack response
      }

      // Check and award guild badges
      try {
        newGuildBadges = await checkAndAwardGuildBadges(
          supabase,
          guildId,
          bossFight.boss_key,
          newGuildLevel,
        );
      } catch (badgeErr) {
        console.error('[api/boss/attack] Failed to award guild badges:', badgeErr);
      }
    }

    // =====================================================
    // 7. RETURN SUCCESS
    // =====================================================
    return NextResponse.json(
      {
        success: true,
        attack: {
          score: evaluation.score,
          damage_dealt: damageDealt,
          user_role: userRole,
        },
        evaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          suggestions: evaluation.suggestions,
        },
        boss_state: {
          boss_key: bossFight.boss_key,
          boss_rarity: bossFight.boss_rarity,
          max_hp: bossFight.boss_max_hp,
          current_hp: newCurrentHp,
          total_damage: newTotalDamage,
          is_defeated: isDefeated,
        },
        rewards: {
          guild_xp: justDefeated ? guildXpReward : 0,
          user_xp: justDefeated ? userXpReward : 0,
          message: isDefeated ? 'Boss defeated!' : 'Attack successful!',
        },
        newGuildBadges: justDefeated ? newGuildBadges : [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/boss/attack] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/boss/attack
 * 
 * Returns usage documentation (for debugging)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/boss/attack',
    description: 'Process a boss attack for the authenticated user',
    auth: 'Bearer token (from supabase auth)',
    body: {
      guildId: 'uuid - target guild ID',
      missionScore: 'number (0-100) - mission evaluation score',
      userRole: "string - 'leader' | 'royal_knight' | 'wizard' | 'member' (default: 'member')",
    },
    response: {
      success: 'boolean',
      attack: {
        mission_score: 'number',
        user_role: 'string',
        damage_dealt: 'number',
        calculation: {
          base_damage: 'number',
          role_multiplier: 'number',
          formula: 'string',
        },
      },
      boss_state: {
        boss_key: 'string',
        boss_rarity: 'number (1-5)',
        max_hp: 'number',
        current_hp: 'number',
        total_damage: 'number',
        is_defeated: 'boolean',
      },
      rewards: {
        guild_xp: 'number (if defeated)',
        user_xp: 'number (if defeated)',
        message: 'string',
      },
      error: 'string (if success=false)',
    },
    example_request: {
      url: 'POST /api/boss/attack',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Content-Type': 'application/json',
      },
      body: {
        guildId: '550e8400-e29b-41d4-a716-446655440000',
        missionScore: 85,
        userRole: 'wizard',
      },
    },
    example_response: {
      success: true,
      attack: {
        mission_score: 85,
        user_role: 'wizard',
        damage_dealt: 191,
        calculation: {
          base_damage: 127.5,
          role_multiplier: 1.5,
          formula: 'floor(score * 1.5 * roleMultiplier)',
        },
      },
      boss_state: {
        boss_key: 'goblin',
        boss_rarity: 1,
        max_hp: 550,
        current_hp: 359,
        total_damage: 191,
        is_defeated: false,
      },
      rewards: {
        message: 'Keep attacking! Boss still alive.',
      },
    },
  });
}
