import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { evaluateBossAnswer } from '@/lib/boss-evaluate';
import type { BossEvaluation } from '@/lib/boss-evaluate';
import { getWeekStart, pickBoss, calculateDamage } from '@/lib/boss';
import bossMissionsData from '@/data/boss_missions.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    // 1. VALIDATE REQUEST
    // =====================================================
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
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
    // 2. CREATE AUTHENTICATED CLIENT
    // =====================================================
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // =====================================================
    // 3. VERIFY AUTHENTICATION
    // =====================================================
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // =====================================================
    // 4. EVALUATE ANSWER WITH OLLAMA
    // =====================================================
    // Get a quest for the boss to use as context
    const bossMissions = (bossMissionsData as any).boss_missions?.[bossKey]?.[1];
    const questContext = Array.isArray(bossMissions) && bossMissions.length > 0
      ? bossMissions[0].text
      : `Defeat the ${bossKey}`;

    const evaluation = await evaluateBossAnswer(
      bossKey,
      questContext,
      userAnswer
    );

    console.log(`[api/boss/attack] Evaluated score: ${evaluation.score} for user answer`);

    // =====================================================
    // 5. PROCESS BOSS ATTACK (WITH PER-GUILD HP)
    // =====================================================
    
    // Calculate week start for deterministic boss
    const now = new Date();
    const utcNow = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const weekStartStr = getWeekStart(utcNow);
    
    // Get or create global boss fight
    let { data: bossFight, error: bossFightError } = await supabase
      .from('boss_fights')
      .select('id, boss_key, boss_rarity, boss_max_hp')
      .eq('week_start', weekStartStr)
      .single();
    
    // If boss doesn't exist, create it with deterministic selection
    if (!bossFight && bossFightError?.code === 'PGRST116') {
      const selectedBoss = pickBoss(weekStartStr);
      
      const { data: newBoss, error: createError } = await supabase
        .from('boss_fights')
        .insert({
          week_start: weekStartStr,
          boss_key: selectedBoss.key,
          boss_rarity: selectedBoss.rarity,
          boss_max_hp: selectedBoss.hp,
          damage_dealt: 0,
          status: 'active',
        })
        .select('id, boss_key, boss_rarity, boss_max_hp')
        .single();
      
      if (createError) {
        console.error('[api/boss/attack] Failed to create boss fight:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create boss fight' },
          { status: 500 }
        );
      }
      
      bossFight = newBoss;
    } else if (bossFightError) {
      console.error('[api/boss/attack] Error fetching boss fight:', bossFightError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch boss fight' },
        { status: 500 }
      );
    }
    
    if (!bossFight) {
      return NextResponse.json(
        { success: false, error: 'Boss fight initialization failed' },
        { status: 500 }
      );
    }
    
    // Get or create guild-specific boss state
    let { data: guildState, error: guildStateError } = await supabase
      .from('boss_guild_state')
      .select('id, current_hp, total_damage')
      .eq('boss_fight_id', bossFight.id)
      .eq('guild_id', guildId)
      .single();
    
    // If guild hasn't attacked this boss yet, create entry with full HP
    if (!guildState && guildStateError?.code === 'PGRST116') {
      const { data: newState, error: createStateError } = await supabase
        .from('boss_guild_state')
        .insert({
          boss_fight_id: bossFight.id,
          guild_id: guildId,
          current_hp: bossFight.boss_max_hp,
          total_damage: 0,
          is_defeated: false,
        })
        .select('id, current_hp, total_damage')
        .single();
      
      if (createStateError) {
        console.error('[api/boss/attack] Failed to create guild state:', createStateError);
        return NextResponse.json(
          { success: false, error: 'Failed to initialize guild state' },
          { status: 500 }
        );
      }
      
      guildState = newState;
    } else if (guildStateError) {
      console.error('[api/boss/attack] Error fetching guild state:', guildStateError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch guild state' },
        { status: 500 }
      );
    }
    
    // Calculate damage for this attack
    const damageDealt = calculateDamage(evaluation.score, userRole as any);
    const newTotalDamage = (guildState?.total_damage || 0) + damageDealt;
    const newCurrentHp = Math.max(0, (guildState?.current_hp || bossFight.boss_max_hp) - damageDealt);
    const isDefeated = newCurrentHp <= 0;
    
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
        user_id: user.id,
        guild_id: guildId,
        boss_fight_id: bossFight.id,
        mission_score: evaluation.score,
        damage_dealt: damageDealt,
        user_role: userRole,
      });
    
    if (attemptError) {
      console.error('[api/boss/attack] Failed to record attempt:', attemptError);
      // Don't fail the whole request, attempt recording is secondary
    }
    
    // =====================================================
    // 6. RETURN SUCCESS
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
          message: isDefeated ? 'Boss defeated!' : 'Attack successful!',
        },
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
