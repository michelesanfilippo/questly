import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme init: runs before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('questly-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark');localStorage.setItem('questly-theme','light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased bg-[#faf7f0] text-slate-900 dark:bg-[#060b1a] dark:text-slate-100 overflow-x-hidden`}>
        {/* Future: wrap with AuthProvider */}
        {children}
      </body>
    </html>
  );
}
