'use client';

import { useEffect } from 'react';

export function ThemeToggle() {
  useEffect(() => {
    // Force light theme — dark mode temporarily disabled
    document.documentElement.classList.remove('dark');
    localStorage.setItem('questly-theme', 'light');
  }, []);

  return (
    <div
      aria-label="Light mode active"
      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 shadow-md opacity-60 cursor-default"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    </div>
  );
}
