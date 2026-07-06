'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import en from './en.json';
import it from './it.json';
import fr from './fr.json';
import es from './es.json';
import de from './de.json';

export type Locale = 'en' | 'it' | 'fr' | 'es' | 'de';
const translations: Record<Locale, typeof en> = { en, it: it as typeof en, fr: fr as typeof en, es: es as typeof en, de: de as typeof en };

interface I18nCtx { locale: Locale; setLocale: (l: Locale) => void; t: (key: string, vars?: Record<string, string | number>) => string; }
const Ctx = createContext<I18nCtx>({ locale: 'en', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('questly-locale') as Locale) ?? 'en';
    return 'en';
  });
  function setAndSave(l: Locale) { setLocale(l); if (typeof window !== 'undefined') localStorage.setItem('questly-locale', l); }
  function t(key: string, vars?: Record<string, string | number>): string {
    const keys = key.split('.');
    let val: unknown = translations[locale];
    for (const k of keys) { if (val && typeof val === 'object') val = (val as Record<string, unknown>)[k]; else { val = undefined; break; } }
    if (typeof val !== 'string') {
      let fb: unknown = translations['en'];
      for (const k of keys) { if (fb && typeof fb === 'object') fb = (fb as Record<string, unknown>)[k]; else { fb = key; break; } }
      val = typeof fb === 'string' ? fb : key;
    }
    let result = val as string;
    if (vars) Object.entries(vars).forEach(([k, v]) => { result = result.replace(`{${k}}`, String(v)); });
    return result;
  }
  return <Ctx.Provider value={{ locale, setLocale: setAndSave, t }}>{children}</Ctx.Provider>;
}
export function useI18n() { return useContext(Ctx); }
export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'it', label: 'IT', flag: '🇮🇹' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
];
