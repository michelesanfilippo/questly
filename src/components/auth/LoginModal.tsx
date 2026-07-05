'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { signInWithGoogle } from '@/lib/supabaseAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  async function handleGoogle() {
    await signInWithGoogle();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="login-modal"
            className="relative w-full max-w-sm mx-4 mt-[20vh] bg-[#faf7f0] dark:bg-slate-900/95 border-2 border-amber-800/30 dark:border-indigo-500/30 rounded-sm shadow-[2px_4px_12px_rgba(101,67,33,0.2)] p-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Corner decorations */}
            <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800/40 dark:border-indigo-400/40" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800/40 dark:border-indigo-400/40" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors text-lg leading-none"
              aria-label="Close"
            >
              &#x2715;
            </button>

            {/* Header */}
            <h2 className="font-serif text-xl text-amber-900 dark:text-indigo-100 mb-1">
              Enter the Realm
            </h2>
            <p className="text-sm text-stone-500 dark:text-indigo-300/70 mb-6">
              Choose your path, adventurer
            </p>

            {/* Google button */}
            <button
              onClick={() => void handleGoogle()}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                />
              </svg>
              Continue with Google
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
