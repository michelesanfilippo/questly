import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { evaluateBossAnswer } from '@/lib/boss-evaluate';
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

    const evaluatedScore = await evaluateBossAnswer(
      bossKey,
      questContext,
      userAnswer
    );

    console.log(`[api/boss/attack] Evaluated score: ${evaluatedScore} for user answer`);

    // =====================================================
    // 5. CALL RPC FUNCTION WITH EVALUATED SCORE
    // =====================================================
    const { data, error } = await supabase.rpc('attack_boss', {
      p_guild_id: guildId,
      p_mission_score: evaluatedScore,
      p_user_role: userRole,
    });

    if (error) {
      console.error('[api/boss/attack] RPC error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to process boss attack',
        },
        { status: 400 }
      );
    }

    if (!data || !data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || 'Unknown error from RPC',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 6. RETURN SUCCESS
    // =====================================================
    return NextResponse.json(
      {
        success: true,
        attack: {
          ...data.attack,
          score: evaluatedScore, // Include the evaluated score
        },
        boss_state: data.boss_state,
        rewards: data.rewards,
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
