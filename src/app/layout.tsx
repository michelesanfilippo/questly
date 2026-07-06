import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://questly-realm.vercel.app'),
  title: 'Questly - Fantasy prompt',
  description: 'A fantasy gamified platform for learning prompt engineering and GenAI through daily missions.',
  icons: {
    icon: '/images/questly-removebg-preview.png',
    apple: '/images/questly-removebg-preview.png',
  },
  openGraph: {
    title: 'Questly - Fantasy prompt',
    description: 'Learn prompt engineering through daily fantasy missions.',
    type: 'website',
    url: 'https://questly-realm.vercel.app',
    images: [
      {
        url: 'https://questly-realm.vercel.app/images/day-uw.png',
        width: 1024,
        height: 434,
        alt: 'Questly — Fantasy Prompt Engineering Platform',
      },
    ],
    siteName: 'Questly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Questly - Fantasy prompt',
    description: 'Learn prompt engineering through daily fantasy missions.',
    images: ['https://questly-realm.vercel.app/images/day-uw.png'],
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

