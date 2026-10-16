import { db, ensureSchema, logRun } from './db.js';
import { fetchReleases, flattenAssets, snapshotDownloads } from './github-sync.js';
import { syncWebAnalytics, webAnalyticsConfigured } from './vercel-sync.js';

// GitHub is snapshotted on every call — the hourly resolution of the download
// chart depends on it. Web Analytics already has hourly data inside Vercel, so
// it only needs copying out often enough to never fall off the 30-day window;
// every few hours keeps "today" fresh without burning API calls.
const WEB_EVERY_MS = 3 * 3_600_000;

export async function runSync({ trigger = 'manual', forceWeb = false } = {}) {
  await ensureSchema();
  const result = {};

  const ghStarted = new Date();
  try {
    const assets = flattenAssets(await fetchReleases());
    result.github = await snapshotDownloads(assets, ghStarted);
    await logRun('github', trigger, ghStarted, true, result.github);
  } catch (error) {
    result.github = { error: error.message };
    await logRun('github', trigger, ghStarted, false, result.github).catch(() => {});
  }

  if (!webAnalyticsConfigured()) {
    result.web = { skipped: 'VERCEL_ANALYTICS_TOKEN is not set' };
    return result;
  }

  const [last] = await db()`
    SELECT finished_at FROM sync_runs WHERE source = 'vercel' AND ok ORDER BY finished_at DESC LIMIT 1`;
  if (!forceWeb && last && Date.now() - new Date(last.finished_at).getTime() < WEB_EVERY_MS) {
    result.web = { skipped: 'synced recently' };
    return result;
  }

  const webStarted = new Date();
  try {
    result.web = await syncWebAnalytics({
      backfillDays: Number(process.env.VERCEL_ANALYTICS_BACKFILL_DAYS) || 30,
    });
    await logRun('vercel', trigger, webStarted, true, result.web);
  } catch (error) {
    result.web = { error: error.message };
    await logRun('vercel', trigger, webStarted, false, result.web).catch(() => {});
  }

  return result;
}
