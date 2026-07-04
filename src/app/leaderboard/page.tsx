'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { getProfile } from '@/lib/auth';
import type { UserProfile } from '@/types';

export default function LeaderboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            aria-label="Back to home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
        </div>

        {!profile ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-slate-400 text-lg">
              Complete your first mission to appear on the leaderboard
            </p>
            <Link
              href="/"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Start a Mission
            </Link>
          </div>
        ) : (
          <Leaderboard currentUser={profile} />
        )}
      </div>
    </main>
  );
}
