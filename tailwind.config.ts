import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#F5C842',
          light: '#FFE08A',
          dark: '#B8960C',
        },
        'mystic-purple': {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#4C1D95',
        },
        'dawn-orange': {
          DEFAULT: '#F97316',
          light: '#FDBA74',
          dark: '#C2410C',
        },
        'night-blue': {
          DEFAULT: '#0F172A',
          light: '#1E293B',
          dark: '#020617',
        },
        'forest-green': {
          DEFAULT: '#16A34A',
          light: '#4ADE80',
          dark: '#14532D',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        fantasy: ['var(--font-cinzel)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'dawn-sky': 'linear-gradient(to bottom, #FED7AA, #FEF3C7, #E0F2FE)',
        'night-sky': 'linear-gradient(to bottom, #020617, #0F172A, #1E1B4B)',
      },
      animation: {
        'star-twinkle': 'twinkle 3s ease-in-out infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        glow: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.3)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
