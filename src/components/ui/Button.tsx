'use client';

import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-violet-700 hover:bg-violet-800 active:bg-violet-900 text-white border-transparent shadow-md',
  secondary: 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 border-transparent shadow-md',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600',
};

export function Button({ variant = 'primary', className = '', children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        px-5 py-2.5 rounded-xl text-sm font-semibold
        border transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
