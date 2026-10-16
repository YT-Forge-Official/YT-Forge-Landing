import { NextResponse } from 'next/server';
import { runSync } from '@/lib/analytics/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// The dashboard's "Sync now" button. It sits under /stats, so the same
// password gate in middleware.js covers it — no cron secret in the browser.
export async function POST() {
  const result = await runSync({ trigger: 'dashboard', forceWeb: true });
  return NextResponse.json(result, { status: result.github?.error ? 500 : 200 });
}
