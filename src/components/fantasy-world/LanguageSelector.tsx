'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n, LOCALES } from '@/i18n';

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 sm:px-3 rounded-xl flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold transition-all shadow-md"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#faf7f0] border border-amber-200 rounded-sm shadow-lg z-30 min-w-[80px]">
          {LOCALES.map((l) => (
            <div
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors"
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
