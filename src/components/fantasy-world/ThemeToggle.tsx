'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize from system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        w-10 h-10 rounded-full flex items-center justify-center
        bg-white/20 backdrop-blur-sm border border-white/30
        hover:bg-white/30 transition-all duration-200
        text-lg font-bold text-white shadow-md
      "
    >
      {isDark ? '★' : '☀'}
    </button>
  );
}
