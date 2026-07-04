import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Questly - Fantasy Prompt Engineering',
  description: 'A fantasy gamified platform for learning prompt engineering and GenAI through daily AI-evaluated missions.',
  icons: {
    icon: '/images/questly.jpg',
    apple: '/images/questly.jpg',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme init: runs before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('questly-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased bg-slate-900 text-slate-100 overflow-hidden`}>
        {/* Future: wrap with AuthProvider */}
        {children}
      </body>
    </html>
  );
}
