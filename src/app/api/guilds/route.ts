import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabaseServer';
import { createGuildRecord, getCurrentGuild, joinGuildRecord, listGuilds } from '@/lib/guildsDb';

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
      });
    }

    const guildsResult = await listGuilds(auth.user.id);
    return NextResponse.json({ guilds: guildsResult.guilds, membership: guildsResult.membership });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load guilds' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  let body: { action?: 'create' | 'join'; name?: string; guildId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action ?? 'create';

  try {
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

    const result = await createGuildRecord(auth.user.id, name);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update guild' }, { status: 400 });
  }
}
