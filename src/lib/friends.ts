export type FriendshipStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends' | 'self';

interface FriendshipPayload {
  status: FriendshipStatus;
}

export async function listFriends(userId: string): Promise<string[]> {
  const response = await fetch('/api/friends', { method: 'GET', credentials: 'include' });
  if (!response.ok) return [];
  const payload = await response.json() as { friends?: string[] };
  return payload.friends ?? [];
}

export async function listIncomingRequests(userId: string): Promise<Array<{ userId: string; requestedBy: string; createdAt: string }>> {
  const response = await fetch('/api/friends', { method: 'GET', credentials: 'include' });
  if (!response.ok) return [];
  const payload = await response.json() as { incomingRequests?: Array<{ userId: string; requestedBy: string; createdAt: string }> };
  return payload.incomingRequests ?? [];
}

export async function friendshipStatus(a: string, b: string, currentUserId?: string): Promise<FriendshipStatus> {
  if (!a || !b) return 'none';
  if (currentUserId && a === currentUserId && b === currentUserId) return 'self';
  const response = await fetch('/api/friends', { method: 'GET', credentials: 'include' });
  if (!response.ok) return 'none';
  const payload = await response.json() as { friends?: string[]; incomingRequests?: Array<{ userId: string }> };
  const friendIds = payload.friends ?? [];
  if (friendIds.includes(b)) return 'friends';
  if (payload.incomingRequests?.some((item) => item.userId === b)) return 'pending_incoming';
  return 'none';
}

export async function sendRequest(targetId: string, currentUserId?: string): Promise<FriendshipStatus> {
  if (!targetId || !currentUserId || targetId === currentUserId) {
    return 'self';
  }

  const response = await fetch('/api/friends', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (payload?.error === 'Friend limit reached') return 'friends';
    return 'none';
  }

  const payload = await response.json() as FriendshipPayload;
  return payload.status;
}

export async function respondRequest(targetId: string, accept: boolean, currentUserId?: string) {
  if (!targetId || !currentUserId) return;

  await fetch('/api/friends/respond', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId, accept }),
  });
}

export function subscribeToFriendshipChanges(handler: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('questly:friendshipsChanged', handler);
  return () => window.removeEventListener('questly:friendshipsChanged', handler);
}
