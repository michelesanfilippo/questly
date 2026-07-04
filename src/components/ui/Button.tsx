'use client';

import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-mystic-purple hover:bg-mystic-purple-dark text-white border-transparent shadow-md',
  secondary: 'bg-gold hover:bg-gold-dark text-night-blue border-transparent shadow-md',
  ghost: 'bg-transparent hover:bg-white/10 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
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
