import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import AppProviders from '@/components/providers/AppProviders';
import CommandPalette from '@/components/overlays/CommandPalette';
import ShortcutMap from '@/components/overlays/ShortcutMap';
import GlobalKeyboard from '@/components/overlays/GlobalKeyboard';
import './globals.css';

export const metadata: Metadata = {
  title: 'Moku for Research',
  description: 'All-in-one academic research platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Prevent FOUC: set theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('moku-theme')||'dark';document.documentElement.dataset.theme=t;})();`,
          }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }}>
        <AppProviders>
          <GlobalKeyboard />
          <CommandPalette />
          <ShortcutMap />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
