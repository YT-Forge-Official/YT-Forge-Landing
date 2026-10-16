import { db, ensureSchema } from './db.js';
import { classifyAsset } from './assets.js';

/**
 * Everything the dashboard draws, in one trip, packed into arrays rather than
 * objects so a year of history stays a small payload. All filtering, bucketing
 * and time-zone work happens in the browser, so changing a range is instant.
 */
export async function loadDashboard() {
  await ensureSchema();
  const sql = db();

  const [assets, events, hours, breakdown, runs] = await Promise.all([
    sql`SELECT asset_id, release_tag, release_published_at, prerelease, name,
               first_seen_at, baseline_count, last_count
        FROM gh_assets
        ORDER BY release_published_at DESC NULLS LAST, name`,
    sql`SELECT asset_id, since, observed_at, delta
        FROM gh_download_events
        ORDER BY observed_at`,
    sql`SELECT hour, pageviews, visitors FROM web_hourly ORDER BY hour`,
    sql`SELECT day, dimension, value, pageviews, visitors FROM web_breakdown`,
    sql`SELECT DISTINCT ON (source) source, finished_at, ok, detail
        FROM sync_runs
        ORDER BY source, finished_at DESC`,
  ]);

  const index = new Map(assets.map((asset, i) => [String(asset.asset_id), i]));
  const ms = (value) => new Date(value).getTime();

  return {
    generatedAt: Date.now(),
    trackingSince: assets.length ? Math.min(...assets.map((a) => ms(a.first_seen_at))) : null,
    assets: assets.map((a) => ({
      tag: a.release_tag,
      published: a.release_published_at ? ms(a.release_published_at) : null,
      prerelease: a.prerelease,
      name: a.name,
      baseline: a.baseline_count,
      total: a.last_count,
      ...classifyAsset(a.name),
    })),
    // [assetIndex, since, observedAt, delta]
    events: events.map((e) => [index.get(String(e.asset_id)), ms(e.since), ms(e.observed_at), e.delta]),
    // [hourStart, pageviews, visitors]
    traffic: hours.map((h) => [ms(h.hour), h.pageviews, h.visitors]),
    // [utcDay 'YYYY-MM-DD', dimension, value, pageviews, visitors]
    breakdown: breakdown.map((b) => [
      typeof b.day === 'string' ? b.day : new Date(b.day).toISOString().slice(0, 10),
      b.dimension,
      b.value,
      b.pageviews,
      b.visitors,
    ]),
    runs: Object.fromEntries(
      runs.map((r) => [r.source, { at: ms(r.finished_at), ok: r.ok, detail: r.detail }]),
    ),
    webConfigured: Boolean(process.env.VERCEL_ANALYTICS_TOKEN),
  };
}
