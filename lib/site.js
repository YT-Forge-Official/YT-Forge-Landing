// Single source of truth for the landing page.
// Bump VERSION on a new release and every download link follows.

export const VERSION = '1.0.8';
export const REPO = 'YT-Forge-Official/YT-Forge';
export const REPO_URL = `https://github.com/${REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases`;
export const LATEST_URL = `${RELEASES_URL}/latest`;
export const ISSUES_URL = `${REPO_URL}/issues`;

// Shown when GitHub's API is unreachable at render time. Round it down and
// nudge it on a release, so the fallback never overstates the real figure.
export const DOWNLOADS_FALLBACK = 2900;

/**
 * A count as a headline figure: rounded *down* to one decimal thousand, with a
 * trailing "+", so the strip reads 2.9k+ off 2,922 and can never claim more
 * than the real number.
 */
export function formatApprox(n) {
  if (typeof n !== 'number' || n <= 0) return null;
  if (n < 1000) return `${Math.floor(n / 10) * 10}+`;
  if (n < 10000) return `${Math.floor(n / 100) / 10}k+`;
  return `${Math.floor(n / 1000)}k+`;
}

// The engine under the hood.
export const YT_DLP_URL = 'https://github.com/yt-dlp/';

const dl = (file) => `${RELEASES_URL}/download/v${VERSION}/${file}`;

export const PLATFORMS = [
  {
    id: 'mac',
    name: 'macOS',
    tagline: 'M series',
    note: 'Apple silicon',
    ext: '.dmg',
    builds: [
      { label: 'M series (arm64)', href: dl(`YT-Forge-${VERSION}-arm64.dmg`), primary: true },
    ],
  },
  {
    id: 'windows',
    name: 'Windows',
    tagline: 'Intel / AMD & ARM',
    note: 'Universal installer',
    ext: '.exe',
    builds: [
      { label: 'Installer (x64 + ARM)', href: dl(`YT-Forge-Setup-${VERSION}.exe`), primary: true },
    ],
  },
  {
    id: 'linux',
    name: 'Linux',
    tagline: 'AppImage',
    note: 'x64',
    ext: '.AppImage',
    builds: [
      { label: 'x64 (standard PCs)', href: dl(`YT-Forge-${VERSION}.AppImage`), primary: true },
      { label: 'arm64 (Raspberry Pi)', href: dl(`YT-Forge-${VERSION}-arm64.AppImage`) },
    ],
  },
];

export const AUTHOR = {
  name: 'Suja Rahaman',
  role: 'Developer',
  photo: '/suja.jpg',
};

// Channel facts, read off the channel header on 2026-08-31. YouTube renders
// other channels' counts in the same page, so these are pinned constants
// (same idea as DOWNLOADS_FALLBACK) rather than anything live — nudge them.
export const YOUTUBE = {
  name: 'Suja Rahaman',
  handle: '@suja_rahaman',
  href: 'https://www.youtube.com/@suja_rahaman',
  avatar: '/suja-channel.jpg',
  subs: '2.44K',
  views: '382K',
  videos: '41',
};

export const SOCIALS = [
  { id: 'github', label: 'GitHub', handle: 'Shaikh-Suja-Rahaman', href: 'https://github.com/Shaikh-Suja-Rahaman' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'shaikh-suja-rahaman',
    href: 'https://www.linkedin.com/in/shaikh-suja-rahaman-410362322/',
  },
  { id: 'instagram', label: 'Instagram', handle: '@suja_rahaman', href: 'https://www.instagram.com/suja_rahaman/' },
];

// Tip jar. The Ko-fi embed script ships its own floating button and its own
// type, so the page links to the page directly and wears its own clothes.
export const KOFI = {
  id: 'kofi',
  label: 'Ko-fi',
  handle: 'Buy me a coffee',
  href: 'https://ko-fi.com/D3Z1266RDI',
};

export const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Download', href: '#download' },
];

export const FEATURES = [
  {
    n: '01',
    title: 'Editor-first formats',
    body: 'H.264 + AAC is picked by default, not AV1 or VP9. Files drop straight onto a Premiere or Resolve timeline with no transcode wait.',
  },
  {
    n: '02',
    title: 'Built-in H.264 conversion',
    body: 'Already grabbed a VP9 or AV1 file? Convert it in place with the bundled ffmpeg. No second app, no command line.',
  },
  {
    n: '03',
    title: 'Whole playlists',
    body: 'Paste a playlist URL, pick a folder, walk away. Batch queue with per-item progress and a resumable download list.',
  },
  {
    n: '04',
    title: 'No ads, no tracking',
    body: 'Source-available under PolyForm Noncommercial, and free for personal use. No telemetry, no upsell modal, no sketchy redirect chain before your download starts.',
  },
];

// Order matters — the two Adobe apps sit together in the marquee.
export const EDITORS = [
  { name: 'Premiere Pro', icon: '/adobe-premiere-pro-icon.png' },
  { name: 'After Effects', icon: '/adobe_after_effects_macos_bigsur_icon_190464.png' },
  { name: 'Final Cut Pro', icon: '/final_cut_pro_macos_bigsur_icon_190177.png' },
  { name: 'DaVinci Resolve', icon: '/davinci_resolve_macos_bigsur_icon_190261.png' },
  { name: 'CapCut', icon: '/capcut-icon.png' },
  { name: 'Filmora', icon: '/filmora-icon.png' },
  { name: 'VLC', icon: '/vlc-icon.png' },
  { name: 'OBS Studio', icon: '/obs-icon.png' },
  { name: 'QuickTime Player', icon: '/quicktime-icon.png' },
];
