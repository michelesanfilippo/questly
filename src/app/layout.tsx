import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/i18n';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Questly - Learn to prompt.',
  description: 'A fantasy gamified platform for learning prompt engineering and GenAI through daily AI-evaluated missions.',
  icons: {
    icon: '/images/questly-removebg-preview.png',
    apple: '/images/questly-removebg-preview.png',
  },
  openGraph: {
    title: 'Questly - Fantasy Prompt Engineering',
    description: 'Learn prompt engineering through daily fantasy missions, evaluated by AI.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-[#faf7f0] text-slate-900 overflow-x-hidden`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
