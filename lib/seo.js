// The canonical origin, in one place. Everything that has to emit an absolute
// URL — robots, sitemap, canonical link, JSON-LD, OG tags — reads it from
// here, so the domain can never drift out of sync between them.
//
// Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deploy; it is the
// fallback for preview builds, which have no custom domain of their own.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://yt-forge.com');
