'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/types';
import {
  isNicknameValid,
  isNicknameAvailable,
  createProfile,
  saveProfile,
} from '@/lib/auth';

interface NicknameSetupProps {
  onComplete: (profile: UserProfile) => void;
}

export function NicknameSetup({ onComplete }: NicknameSetupProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const valid = isNicknameValid(nickname);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNickname(val);
    setError(null);
  }

  async function handleConfirm() {
    if (!valid) return;
    setLoading(true);
    try {
      const available = await isNicknameAvailable(nickname);
      if (!available) {
        setError('Nickname already taken. Choose another.');
        setLoading(false);
        return;
      }
      const profile = createProfile(nickname);
      saveProfile(profile);
      onComplete(profile);
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && valid && !loading) {
      void handleConfirm();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8 mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">
          Choose Your Name, Adventurer
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          3-20 chars, alphanumeric + underscore
        </p>

        <input
          type="text"
          value={nickname}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="your_nickname"
          maxLength={20}
          autoFocus
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />

        {nickname.length > 0 && !valid && (
          <p className="mt-2 text-sm text-red-400">
            3-20 chars — letters, numbers, underscore only
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <button
          onClick={() => void handleConfirm()}
          disabled={!valid || loading}
          className="mt-6 w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Checking...' : 'Enter the World'}
        </button>
      </motion.div>
    </div>
  );
}
