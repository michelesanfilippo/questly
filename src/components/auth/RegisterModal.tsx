'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { signUpWithPassword } from '@/lib/supabaseAuth';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PW = 8;

export function RegisterModal({ isOpen, onClose, onBackToLogin }: RegisterModalProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  if (!isOpen) return null;

  const emailValid = EMAIL_REGEX.test(email);
  const pwValid    = password.length >= MIN_PW;
  const canSubmit  = emailValid && pwValid && !loading;

  const emailBorder =
    email.length === 0 ? 'border-amber-800/20 dark:border-indigo-500/30' :
    emailValid         ? 'border-emerald-500' : 'border-red-400';

  const pwBorder =
    password.length === 0 ? 'border-amber-800/20 dark:border-indigo-500/30' :
    pwValid                ? 'border-emerald-500' : 'border-red-400';

  async function handleRegister() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signUpWithPassword(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="register-modal"
            className="relative w-full max-w-sm mx-4 bg-[#faf7f0] dark:bg-slate-900/95 border-2 border-amber-800/30 dark:border-indigo-500/30 rounded-sm shadow-[2px_4px_12px_rgba(101,67,33,0.2)] p-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />

            <button onClick={onClose} className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors text-lg leading-none">&#x2715;</button>

            <h2 className="font-serif text-xl text-amber-900 dark:text-indigo-100 mb-1">Join the Realm</h2>
            <p className="text-sm text-stone-500 dark:text-indigo-300/70 mb-5">Create your account, adventurer</p>

            {done ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                  Welcome! Check your email to confirm your account.
                </p>
                <p className="text-xs text-stone-500 dark:text-indigo-300/70">
                  Once confirmed, sign in with your email and password.
                </p>
                <button
                  onClick={() => { onClose(); onBackToLogin(); }}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold text-sm py-2.5 rounded-sm border border-amber-600 transition-colors mt-2"
                >
                  Back to Sign in
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    placeholder="your@email.com"
                    className={`w-full bg-amber-50/50 dark:bg-slate-800 border-2 rounded-sm px-4 py-2.5 text-sm text-amber-900 dark:text-indigo-100 placeholder-stone-400 dark:placeholder-indigo-400/40 focus:outline-none transition-all ${emailBorder}`}
                  />
                  {email.length > 0 && !emailValid && (
                    <p className="text-xs text-red-500 mt-1">Invalid email format</p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === 'Enter' && void handleRegister()}
                    placeholder="Password (min 8 characters)"
                    className={`w-full bg-amber-50/50 dark:bg-slate-800 border-2 rounded-sm px-4 py-2.5 text-sm text-amber-900 dark:text-indigo-100 placeholder-stone-400 dark:placeholder-indigo-400/40 focus:outline-none transition-all ${pwBorder}`}
                  />
                  {password.length > 0 && !pwValid && (
                    <p className="text-xs text-red-500 mt-1">Minimum 8 characters</p>
                  )}
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  onClick={() => void handleRegister()}
                  disabled={!canSubmit}
                  className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed text-amber-50 font-semibold text-sm py-2.5 rounded-sm border border-amber-600 transition-colors"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <button
                  onClick={() => { onClose(); onBackToLogin(); }}
                  className="w-full text-xs text-stone-400 dark:text-indigo-400/50 hover:text-amber-700 dark:hover:text-indigo-200 transition-colors py-1"
                >
                  Already have an account? Sign in
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
