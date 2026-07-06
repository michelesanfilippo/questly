'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { LanguageSelector } from './LanguageSelector';
import { AmbientEffects } from './AmbientEffects';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/supabaseAuth';

export function VillageScene() {
  const { t } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    return () => { subscription.unsubscribe(); };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/day-uw.png"
          alt="Fantasy village at dawn"
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
          quality={100}
        />
      </div>

      <AmbientEffects />

      {/* Logo + LanguageSelector — top left */}
      <div className="absolute top-4 left-4 z-20 flex flex-col items-center gap-2">
        <Image
          src="/images/questly-removebg-preview.png"
          alt="Questly"
          width={68}
          height={68}
          className="drop-shadow-lg w-10 h-10 sm:w-12 sm:h-12 lg:w-[68px] lg:h-[68px]"
        />
        <LanguageSelector />
      </div>

      {/* Login / Sign out button — top right */}
      <div className="absolute top-4 right-4 z-20">
        {isLoggedIn ? (
          <button
            onClick={() => signOut()}
            className="px-4 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-2.5 rounded-2xl text-xs sm:text-sm lg:text-base font-semibold border backdrop-blur-sm transition-all duration-200 bg-amber-800/40 hover:bg-amber-700/50 active:bg-amber-800/60 text-amber-50 border-amber-600/50 shadow-md"
          >
            {t('nav.signout')}
          </button>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('questly:openLogin'))}
            className="px-4 py-1.5 sm:px-6 sm:py-2 lg:px-10 lg:py-2.5 rounded-2xl text-xs sm:text-sm lg:text-base font-semibold border backdrop-blur-sm transition-all duration-200 bg-amber-800/40 hover:bg-amber-700/50 active:bg-amber-800/60 text-amber-50 border-amber-600/50 shadow-md"
          >
            {t('nav.login')}
          </button>
        )}
      </div>
    </div>
  );
}
