'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { SupabaseProfile } from '@/types';
import { isNicknameAvailable, createProfile, getProfile } from '@/lib/supabaseAuth';

type NicknameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface NicknameSetupProps {
  userId: string;
  email: string | null;
  onComplete: (profile: SupabaseProfile) => void;
}

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function NicknameSetup({ userId, email, onComplete }: NicknameSetupProps) {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<NicknameState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounced availability check
  useEffect(() => {
    if (nickname.length === 0) {
      setStatus('idle');
      return;
    }
    if (!NICKNAME_REGEX.test(nickname)) {
      setStatus('invalid');
      return;
    }
    setStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await isNicknameAvailable(nickname);
        setStatus(available ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNickname(e.target.value);
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (status !== 'available' || loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await createProfile(userId, nickname, email);
      const result = await getProfile(userId);
      if (result.error || !result.data) {
        setSubmitError('Failed to load profile. Try again.');
        setLoading(false);
        return;
      }
      onComplete(result.data as SupabaseProfile);
    } catch {
      setSubmitError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void handleSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center">
      <motion.div
        className="relative w-full max-w-sm mx-4 mt-[20vh] bg-[#faf7f0] dark:bg-slate-900/95 border-2 border-amber-800/30 dark:border-indigo-500/30 rounded-sm shadow-[2px_4px_12px_rgba(101,67,33,0.2)] p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {/* Corner decorations */}
        <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
        <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />
        <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
        <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />

        {/* Header */}
        <h2 className="font-serif text-xl text-amber-900 dark:text-indigo-100 mb-1">
          Choose Your Name
        </h2>
        <p className="text-sm text-stone-500 dark:text-indigo-300/70 mb-6">
          3-20 chars, letters, numbers, underscore
        </p>

        {/* Input + status indicator */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={nickname}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="your_nickname"
            maxLength={20}
            autoFocus
            className="w-full bg-amber-50/50 dark:bg-slate-800 border border-amber-800/20 dark:border-indigo-500/30 rounded-sm px-4 py-2.5 text-sm text-amber-900 dark:text-indigo-100 placeholder-stone-400 dark:placeholder-indigo-400/40 focus:outline-none focus:border-amber-600 dark:focus:border-indigo-400 transition-colors pr-24"
          />
          <div className="absolute right-3 flex items-center">
            {status === 'checking' && (
              <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'available' && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Available</span>
            )}
            {status === 'taken' && (
              <span className="text-xs text-red-500 dark:text-red-400 font-medium">Already taken</span>
            )}
            {status === 'invalid' && nickname.length > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Invalid format</span>
            )}
          </div>
        </div>

        {submitError && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">{submitError}</p>
        )}

        {/* Submit */}
        <button
          onClick={() => void handleSubmit()}
          disabled={status !== 'available' || loading}
          className="mt-5 w-full bg-amber-700 hover:bg-amber-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-sm transition-colors"
        >
          {loading ? 'Setting up...' : 'Enter the World'}
        </button>
      </motion.div>
    </div>
  );
}
