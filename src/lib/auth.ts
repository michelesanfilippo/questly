'use client';

import type { UserProfile } from '@/types';

const STORAGE_KEY = 'questly-profile';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createProfile(nickname: string): UserProfile {
  const today = new Date().toISOString().slice(0, 10);
  const avatar = nickname.slice(0, 2).toUpperCase();
  return {
    id: generateId(),
    nickname,
    avatar,
    createdAt: new Date().toISOString(),
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: today,
    trophies: [],
    badges: [],
    unlockedWorldFeatures: [],
    completedMissions: [],
  };
}

export function isNicknameValid(nickname: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(nickname);
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  // Mock: only 'taken' is reserved
  return nickname.toLowerCase() !== 'taken';
}
