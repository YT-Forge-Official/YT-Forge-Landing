'use client';

import { Analytics } from '@vercel/analytics/next';

// The private dashboard reads these numbers; it shouldn't add to them. Every
// visit to /stats would otherwise show up as landing-page traffic.
export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => (new URL(event.url).pathname.startsWith('/stats') ? null : event)} />;
}
