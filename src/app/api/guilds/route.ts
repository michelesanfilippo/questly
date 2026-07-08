import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabaseServer';
import { assignRoleRecord, createGuildRecord, getCurrentGuild, joinGuildRecord, kickMemberRecord, leaveGuildRecord, listGuilds, listJoinRequestsRecord, applyToGuildRecord, respondJoinRequestRecord, updateGuildIconRecord } from '@/lib/guildsDb';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  try {
    const scope = req.nextUrl.searchParams.get('scope');
    if (scope === 'current' || scope === 'members') {
      const currentGuild = await getCurrentGuild(auth.user.id);
      return NextResponse.json({
        guild: currentGuild?.guild ?? null,
        role: currentGuild?.role ?? null,
        members: currentGuild?.members ?? [],
        requestCount: currentGuild?.requestCount ?? 0,
      });
    }

    if (scope === 'requests') {
      const result = await listJoinRequestsRecord(auth.user.id);
      return NextResponse.json(result);
    }

    const guildsResult = await listGuilds(auth.user.id);
    return NextResponse.json({ guilds: guildsResult.guilds, membership: guildsResult.membership });
  } catch (error) {
    console.error('[API /guilds GET] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load guilds' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  let body: { action?: 'create' | 'join' | 'leave' | 'apply' | 'kick' | 'assign_role' | 'respond_request' | 'set_icon'; name?: string; description?: string; guildId?: string; targetUserId?: string; role?: string; demoteUserId?: string; requestId?: string; accept?: boolean; iconKey?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error('[API /guilds POST] JSON parse error:', err);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action ?? 'create';

  try {
    if (action === 'leave') {
      const result = await leaveGuildRecord(auth.user.id);
      return NextResponse.json(result);
    }

    if (action === 'apply') {
      const guildId = body.guildId?.trim();
      if (!guildId) return NextResponse.json({ error: 'Guild id is required' }, { status: 400 });
      const result = await applyToGuildRecord(auth.user.id, guildId);
      return NextResponse.json(result);
    }

    if (action === 'kick') {
      const targetUserId = body.targetUserId?.trim();
      if (!targetUserId) return NextResponse.json({ error: 'Target user id is required' }, { status: 400 });
      const result = await kickMemberRecord(auth.user.id, targetUserId);
      return NextResponse.json(result);
    }

    if (action === 'assign_role') {
      const targetUserId = body.targetUserId?.trim();
      const role = body.role as 'royal_knight' | 'wizard' | 'member' | undefined;
      if (!targetUserId || !role) return NextResponse.json({ error: 'Target user id and role are required' }, { status: 400 });
      const result = await assignRoleRecord(auth.user.id, targetUserId, role, body.demoteUserId?.trim());
      return NextResponse.json(result);
    }

    if (action === 'respond_request') {
      const requestId = body.requestId?.trim();
      if (!requestId || body.accept === undefined) return NextResponse.json({ error: 'Request id and accept flag are required' }, { status: 400 });
      const result = await respondJoinRequestRecord(auth.user.id, requestId, body.accept);
      return NextResponse.json(result);
    }

    if (action === 'set_icon') {
      const iconKey = body.iconKey?.trim();
      if (!iconKey) return NextResponse.json({ error: 'iconKey is required' }, { status: 400 });
      const result = await updateGuildIconRecord(auth.user.id, iconKey);
      return NextResponse.json(result);
    }

    if (action === 'join') {
      const guildId = body.guildId?.trim();
      if (!guildId) {
        return NextResponse.json({ error: 'Guild id is required' }, { status: 400 });
      }

      const result = await joinGuildRecord(auth.user.id, guildId);
      return NextResponse.json(result);
    }

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Guild name is required' }, { status: 400 });
    }

    const result = await createGuildRecord(auth.user.id, name, body.description);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /guilds POST] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update guild' }, { status: 400 });
  }
}
