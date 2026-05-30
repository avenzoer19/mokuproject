import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import AppProviders from '@/components/providers/AppProviders';
import CommandPalette from '@/components/overlays/CommandPalette';
import ShortcutMap from '@/components/overlays/ShortcutMap';
import GlobalKeyboard from '@/components/overlays/GlobalKeyboard';
import './globals.css';

const SITE_URL = 'https://mokuresearch.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Moku for Research — Asisten Riset AI & Platform Riset All-in-One',
    template: '%s · Moku for Research',
  },
  description:
    'Platform riset all-in-one berbasis AI untuk akademisi Indonesia: cari & review jurnal, screening literatur, terjemahkan dokumen ilmiah, kelola data lab, hingga menulis skripsi, tesis, dan manuskrip — dalam satu workspace yang tenang.',
  keywords: [
    'aplikasi asisten riset AI',
    'ai pencari jurnal ilmiah',
    'asisten peneliti ai',
    'tools ai untuk riset akademik',
    'platform riset all in one',
    'aplikasi penelitian terintegrasi',
    'software ekosistem riset',
    'platform manajemen data ilmiah',
    'software manajemen skripsi tesis',
    'aplikasi bantu skripsi',
    'tools untuk mempermudah tesis',
    'software penyusun jurnal ilmiah mahasiswa',
    'alat bantu review jurnal AI',
    'ai untuk merangkum jurnal',
    'cara review paper cepat dengan ai',
    'tools screening literatur otomatis',
    'aplikasi catat jurnal otomatis',
    'software pencatat referensi otomatis',
    'manajemen sitasi jurnal',
  ],
  authors: [{ name: 'Rifqi Aditya' }],
  creator: 'Rifqi Aditya',
  applicationName: 'Moku for Research',
  category: 'education',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: 'Moku for Research',
    title: 'Moku for Research — Asisten Riset AI & Platform Riset All-in-One',
    description:
      'Satukan literatur, screening, terjemahan, data lab, dan penulisan manuskrip dalam satu workspace riset berbasis AI. Dibuat untuk mahasiswa, dosen, dan peneliti Indonesia.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moku for Research — Platform Riset All-in-One Berbasis AI',
    description:
      'Satukan literatur, screening, terjemahan, data lab, dan penulisan manuskrip dalam satu workspace riset berbasis AI untuk akademisi Indonesia.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F1117' },
    { media: '(prefers-color-scheme: light)', color: '#F8F6F1' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Moku for Research',
      url: SITE_URL,
      logo: `${SITE_URL}/icon`,
      slogan: 'Science for Everyone',
      founder: { '@type': 'Person', name: 'Rifqi Aditya', jobTitle: 'Biomedical Engineering' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Moku for Research',
      inLanguage: 'id',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Moku for Research',
      url: SITE_URL,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      inLanguage: 'id',
      description:
        'Platform riset all-in-one berbasis AI untuk akademisi Indonesia: pencarian & review jurnal, screening literatur, terjemahan dokumen ilmiah, manajemen data lab, dan penulisan manuskrip dalam satu workspace.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`}>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
