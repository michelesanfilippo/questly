'use client';

import Link from 'next/link';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] dark:bg-[#060b1a] flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-stone-500 dark:text-indigo-400 hover:text-amber-700 dark:hover:text-indigo-200 transition-colors text-sm">
            ← Back
          </Link>
          <h1 className="text-xl font-serif font-bold text-amber-900 dark:text-indigo-100">Leaderboard</h1>
        </div>
        <Leaderboard />
      </div>
    </main>
  );
}
