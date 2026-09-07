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
  title: 'YT-Forge: Free Universal Video Downloader',
  description:
    'A free, universal video downloader for macOS, Windows, and Linux. Download from YouTube, Instagram, TikTok, Facebook, and 1,000+ other sites. H.264 + AAC by default.',
  // Broad terms first, then the individual sites people actually type. The
  // app reaches everything yt-dlp does, so naming a few is a sample, not
  // the positioning — that lives in the title.
  keywords: [
    'free video downloader',
    'youtube to mp4',
    'yt-dlp gui',
    '4k video downloader',
    '8k video downloader',
    'mac video downloader',
    'windows video downloader',
    'best yt dlp gui',
    'open source video downloader',
    'batch video downloader',
    'youtube playlist downloader',
    'twitter video downloader',
    'instagram video downloader',
    'tiktok video downloader no watermark',
    'reddit video downloader',
    'video downloader for editors',
    'premiere pro video download',
    'h264 video download',
  ],
  authors: [{ name: 'Suja', url: REPO_URL }],
  openGraph: {
    title: 'YT-Forge: Free Universal Video Downloader',
    description:
      'A free, universal video downloader for macOS, Windows, and Linux. Download from YouTube, Instagram, TikTok, Facebook, and 1,000+ other sites. H.264 + AAC by default.',
    type: 'website',
    url: '/',
    siteName: 'YT-Forge',
    locale: 'en_US',
    images: [
      {
        url: '/yt-forge banner v2.png',
        width: 1200,
        height: 630,
        alt: 'YT-Forge: Free Universal Video Downloader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YT-Forge: Free Universal Video Downloader',
    description: 'A free, universal video downloader for macOS, Windows, and Linux. Download from YouTube, Instagram, TikTok, Facebook, and 1,000+ other sites. H.264 + AAC by default.',
    images: ['/yt-forge banner v2.png'],
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
