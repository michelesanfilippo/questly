import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/boss/config
 *
 * Returns boss system configuration flags
 *
 * Response:
 * {
 *   success: boolean
 *   force_weekend_testing: boolean
 * }
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('boss_config')
      .select('force_weekend_testing')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: true,
          force_weekend_testing: false, // Default if table doesn't exist
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        force_weekend_testing: data.force_weekend_testing,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Failed to fetch boss config:', err);
    return NextResponse.json(
      {
        success: true,
        force_weekend_testing: false, // Default on error
      },
      { status: 200 }
    );
  }
}
