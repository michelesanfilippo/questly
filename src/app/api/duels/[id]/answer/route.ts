import { NextRequest, NextResponse } from 'next/server';
import { requireUser, createSupabaseAdminClient } from '@/lib/supabaseServer';
import { evaluatePrompt } from '@/lib/evaluate';
import type { Mission } from '@/types';

const DUEL_XP_REWARD = 20;

/**
 * POST /api/duels/[id]/answer
 * Submit an answer for a duel. Triggers completion if both players answered.
 * Body: { answer: string; userLocale?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const { id: duelId } = await params;

  let body: { answer?: string; userLocale?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { answer, userLocale = 'en' } = body;

  if (!answer || typeof answer !== 'string' || answer.trim().length < 10) {
    return NextResponse.json({ error: 'Answer must be at least 10 characters' }, { status: 400 });
  }

  const supabase = await createSupabaseAdminClient();

  // Fetch duel
  const { data: duel, error: duelError } = await supabase
    .from('duels')
    .select('*')
    .eq('id', duelId)
    .single();

  if (duelError || !duel) {
    return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
  }

  const isChallenger = duel.challenger_id === userId;
  const isChallenged = duel.challenged_id === userId;

  if (!isChallenger && !isChallenged) {
    return NextResponse.json({ error: 'Not a participant in this duel' }, { status: 403 });
  }

  if (duel.status === 'completed' || duel.status === 'declined') {
    return NextResponse.json({ error: 'Duel is already finished' }, { status: 400 });
  }

  // Check if this player already answered
  if (isChallenger && duel.challenger_answer !== null) {
    return NextResponse.json({ error: 'You have already answered' }, { status: 400 });
  }
  if (isChallenged && duel.challenged_answer !== null) {
    return NextResponse.json({ error: 'You have already answered' }, { status: 400 });
  }

  // Evaluate the answer
  const mission = duel.mission_snapshot as Mission;
  const evalResult = await evaluatePrompt(answer.trim(), mission, userLocale);
  const score = evalResult.scores.total;

  // Build update payload
  const updatePayload: Record<string, unknown> = {};
  if (isChallenger) {
    updatePayload.challenger_answer = answer.trim();
    updatePayload.challenger_score = score;
  } else {
    updatePayload.challenged_answer = answer.trim();
    updatePayload.challenged_score = score;
  }

  // Determine new status
  const challengerAnswered = isChallenger ? true : duel.challenger_answer !== null;
  const challengedAnswered = isChallenged ? true : duel.challenged_answer !== null;

  let winnerId: string | null = null;
  if (challengerAnswered && challengedAnswered) {
    updatePayload.status = 'completed';
    const challengerScore = isChallenger ? score : (duel.challenger_score ?? 0);
    const challengedScore = isChallenged ? score : (duel.challenged_score ?? 0);
    if (challengerScore > challengedScore) {
      winnerId = duel.challenger_id;
    } else if (challengedScore > challengerScore) {
      winnerId = duel.challenged_id;
    }
    // null = draw
    updatePayload.winner_id = winnerId;
  } else if (isChallenger) {
    updatePayload.status = 'challenger_answered';
  } else {
    updatePayload.status = 'challenged_answered';
  }

  const { data: updatedDuel, error: updateError } = await supabase
    .from('duels')
    .update(updatePayload)
    .eq('id', duelId)
    .select('*')
    .single();

  if (updateError) {
    console.error('[POST /api/duels/answer]', updateError);
    return NextResponse.json({ error: 'Failed to update duel' }, { status: 500 });
  }

  // Award XP to winner on completion
  if (updatePayload.status === 'completed' && winnerId) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('xp, level, pvp_wins')
        .eq('id', winnerId)
        .single();

      if (prof) {
        let xp = (prof.xp ?? 0) + DUEL_XP_REWARD;
        let level = prof.level ?? 1;
        while (xp >= level * 100) { xp -= level * 100; level++; }
        await supabase
          .from('profiles')
          .update({ xp, level, pvp_wins: (prof.pvp_wins ?? 0) + 1 })
          .eq('id', winnerId);
      }

      // Update pvp_losses for loser
      const loserId = winnerId === duel.challenger_id ? duel.challenged_id : duel.challenger_id;
      const { data: loserProf } = await supabase
        .from('profiles')
        .select('pvp_losses')
        .eq('id', loserId)
        .single();
      if (loserProf) {
        await supabase
          .from('profiles')
          .update({ pvp_losses: (loserProf.pvp_losses ?? 0) + 1 })
          .eq('id', loserId);
      }
    } catch (xpErr) {
      console.error('[POST /api/duels/answer] XP award error:', xpErr);
    }
  }

  return NextResponse.json({
    duel: updatedDuel,
    evaluation: {
      score,
      feedback: evalResult.feedback,
      suggestions: evalResult.suggestions,
    },
  });
}
