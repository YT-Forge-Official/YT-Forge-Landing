import { Geist, Geist_Mono, Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { REPO_URL } from '@/lib/site';
import { SITE_URL } from '@/lib/seo';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

// Matches the wordmark in the Photoshop banner. 600 is the logo lockup, 700
// is the footer wordmark; 500 was being downloaded and never used.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // One address for this page. Without it the apex, the www host and the
  // *.vercel.app deploy URL are three indexable copies competing with
  // each other, and Google picks the winner instead of you.
  alternates: { canonical: '/' },
  title: 'YT-FORGE — Universal video downloader, finally done right',
  description:
    'A fast, source-available video downloader for macOS, Windows and Linux. 1,000+ sites, and it prefers H.264 + AAC so files drop straight onto a Premiere or Resolve timeline.',
  // Broad terms first, then the individual sites people actually type. The
  // app reaches everything yt-dlp does, so naming a few is a sample, not
  // the positioning — that lives in the title.
  keywords: [
    'video downloader',
    'universal video downloader',
    'yt-dlp gui',
    'h264 video download',
    'video downloader for editors',
    'premiere pro video download',
    'youtube downloader',
    'instagram video downloader',
    'tiktok video downloader',
  ],
  authors: [{ name: 'Suja', url: REPO_URL }],
  openGraph: {
    title: 'YT-FORGE — Universal video downloader, finally done right',
    description:
      'Editor-friendly downloads from 1,000+ sites. H.264 + AAC by default, built-in conversion, playlist batching. No ads, no tracking.',
    type: 'website',
    url: '/',
    siteName: 'YT-FORGE',
    locale: 'en_US',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'YT-FORGE — Universal video downloader, finally done right',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YT-FORGE — Universal video downloader, finally done right',
    description: 'Editor-friendly downloads from 1,000+ sites. H.264 + AAC by default.',
    images: ['/og-banner.png'],
  },
  icons: { icon: '/icon.png', apple: '/icon.png' },
  // Defaults cap the text snippet and preview image Google may show. Opting
  // into the large variants is what makes a result look like a product card
  // instead of a bare blue link.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport = {
  themeColor: '#15171a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    /*
      suppressHydrationWarning on both: browser extensions inject attributes
      here (crxlauncher, cz-shortcut-listen, Grammarly and friends) before
      React hydrates, and React reports the diff as a mismatch. It is the
      documented fix for extension-injected attributes, and it suppresses
      only these two elements' own attributes — not their subtrees.
    */
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body className="font-[family-name:var(--font-geist)] antialiased" suppressHydrationWarning>
        {children}

        {/*
          Both beacons post to /_vercel/insights and /_vercel/speed-insights on
          the SAME origin the page was served from, which is what makes them
          domain-agnostic: they follow whatever host is in the address bar, so
          yt-forge.com and the *.vercel.app preview URLs both report into this
          one project. Nothing here needs the domain written down.

          Neither reports outside a real deployment, and there is no key or
          env var to keep in sync — the project is identified by the
          deployment serving the request, not by anything committed here.
        */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
