import { NextResponse } from 'next/server';
import { runSync } from '@/lib/analytics/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Called hourly by .github/workflows/analytics-sync.yml and once a day by the
// Vercel cron in vercel.json (Hobby crons can't run more often than daily).
// Vercel sends `Authorization: Bearer $CRON_SECRET` on its own; the workflow
// sends the same header from a repository secret.
async function handle(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const trigger = request.headers.get('user-agent')?.includes('vercel-cron') ? 'vercel-cron' : url.searchParams.get('trigger') ?? 'manual';
  const result = await runSync({ trigger, forceWeb: url.searchParams.has('web') });

  const failed = Boolean(result.github?.error || result.web?.error);
  return NextResponse.json({ ok: !failed, ...result }, { status: result.github?.error ? 500 : 200 });
}

export const GET = handle;
export const POST = handle;
