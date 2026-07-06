'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  signInWithGoogle, signInWithGitHub, signInWithDiscord,
  signInWithPassword, signUpWithPassword,
} from '@/lib/supabaseAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginModal({ isOpen, onClose, onOpenRegister }: LoginModalProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  if (!isOpen) return null;

  const emailValid = EMAIL_REGEX.test(email);
  const canSubmit  = emailValid && password.length >= 1 && !loading;

  const emailBorder =
    email.length === 0 ? 'border-amber-800/20 dark:border-indigo-500/30' :
    emailValid         ? 'border-emerald-500' :
                         'border-red-400';

  async function handleSignIn() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithPassword(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    onClose();
  }

  const btnOAuth = 'w-full flex items-center justify-center gap-3 border rounded-sm px-4 py-2.5 text-sm font-medium transition-colors';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="login-modal"
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

            <h2 className="font-serif text-xl text-amber-900 dark:text-indigo-100 mb-1">Enter the Realm</h2>
            <p className="text-sm text-stone-500 dark:text-indigo-300/70 mb-5">Choose your path, adventurer</p>

            <div className="space-y-3">
              {/* OAuth */}
              <button onClick={() => void signInWithGoogle()} className={`${btnOAuth} bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700`}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                Continue with Google
              </button>
              <button onClick={() => void signInWithGitHub()} className={`${btnOAuth} bg-[#24292e] hover:bg-[#2f363d] border-[#24292e] text-white`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                Continue with GitHub
              </button>
              <button onClick={() => void signInWithDiscord()} className={`${btnOAuth} bg-[#5865F2] hover:bg-[#4752c4] border-[#5865F2] text-white`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                Continue with Discord
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-amber-800/15 dark:bg-indigo-500/20" />
                <span className="text-xs text-stone-400 dark:text-indigo-400/50">or</span>
                <div className="flex-1 h-px bg-amber-800/15 dark:bg-indigo-500/20" />
              </div>

              {/* Email + Password */}
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder="your@email.com"
                className={`w-full bg-amber-50/50 dark:bg-slate-800 border-2 rounded-sm px-4 py-2.5 text-sm text-amber-900 dark:text-indigo-100 placeholder-stone-400 dark:placeholder-indigo-400/40 focus:outline-none transition-all ${emailBorder}`}
              />
              {email.length > 0 && !emailValid && (
                <p className="text-xs text-red-500 -mt-2">Invalid email format</p>
              )}
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                onKeyDown={e => e.key === 'Enter' && void handleSignIn()}
                placeholder="Password"
                className="w-full bg-amber-50/50 dark:bg-slate-800 border-2 border-amber-800/20 dark:border-indigo-500/30 rounded-sm px-4 py-2.5 text-sm text-amber-900 dark:text-indigo-100 placeholder-stone-400 dark:placeholder-indigo-400/40 focus:outline-none transition-all"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                onClick={() => void handleSignIn()}
                disabled={!canSubmit}
                className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed text-amber-50 font-semibold text-sm py-2.5 rounded-sm border border-amber-600 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Create account */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-amber-800/15 dark:bg-indigo-500/20" />
                <span className="text-xs text-stone-400 dark:text-indigo-400/50">or</span>
                <div className="flex-1 h-px bg-amber-800/15 dark:bg-indigo-500/20" />
              </div>
              <button
                onClick={() => { onClose(); onOpenRegister(); }}
                className="w-full border border-amber-700/40 text-amber-800 dark:text-indigo-300 hover:bg-amber-100/50 dark:hover:bg-indigo-900/30 text-sm py-2.5 rounded-sm transition-colors"
              >
                Create account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
