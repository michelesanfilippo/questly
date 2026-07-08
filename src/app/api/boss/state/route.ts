import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/boss/state?guildId=<uuid>
 *
 * Fetches the GLOBAL boss fight state for this weekend.
 * (guildId is still passed for RLS verification, but boss is global for all guilds)
 *
 * Query params:
 * - guildId: uuid of the guild (for RLS verification)
 *
 * Returns:
 * {
 *   success: boolean
 *   boss?: {
 *     boss_key: string
 *     boss_rarity: number
 *     max_hp: number
 *     current_hp: number
 *     total_damage: number
 *     is_defeated: boolean
 *     total_attempts: number (all guilds combined)
 *   }
 *   error?: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json(
        { success: false, error: 'Missing guildId parameter' },
        { status: 400 }
      );
    }

    // =====================================================
    // CREATE CLIENT & GET AUTH TOKEN
    // =====================================================
    const authHeader = request.headers.get('Authorization');
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    });

    // =====================================================
    // CALCULATE WEEK START (for deterministic boss)
    // =====================================================
    const now = new Date();
    const utcNow = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const dayOfWeek = utcNow.getUTCDay(); // 0=Sun, 1=Mon, ...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(utcNow);
    weekStart.setUTCDate(weekStart.getUTCDate() - daysToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // =====================================================
    // FETCH GLOBAL BOSS FIGHT STATE (no guild_id filter)
    // =====================================================
    const { data: bossData, error: bossError } = await supabase
      .from('boss_fights')
      .select('id, boss_key, boss_rarity, boss_max_hp, damage_dealt, status')
      .eq('week_start', weekStartStr)
      .single();

    if (bossError && bossError.code !== 'PGRST116') {
      // PGRST116 = no rows, which is ok
      console.error('[api/boss/state] Error fetching boss_fights:', bossError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch boss state' },
        { status: 400 }
      );
    }

    // If no boss fight exists, return null boss (RPC will create on first attack)
    if (!bossData) {
      return NextResponse.json(
        {
          success: true,
          boss: null,
          message: 'No active boss this week. First attack will initialize it!',
        },
        { status: 200 }
      );
    }

    // =====================================================
    // COUNT ALL ATTEMPTS (from all guilds)
    // =====================================================
    const { count: totalAttempts } = await supabase
      .from('boss_attempts')
      .select('id', { count: 'exact' })
      .eq('boss_fight_id', bossData.id);

    // =====================================================
    // BUILD RESPONSE
    // =====================================================
    const currentHp = Math.max(0, bossData.boss_max_hp - bossData.damage_dealt);
    const isDefeated = bossData.status === 'defeated';

    return NextResponse.json(
      {
        success: true,
        boss: {
          boss_key: bossData.boss_key,
          boss_rarity: bossData.boss_rarity,
          max_hp: bossData.boss_max_hp,
          current_hp: currentHp,
          total_damage: bossData.damage_dealt,
          is_defeated: isDefeated,
          total_attempts: totalAttempts || 0,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/boss/state] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
