// One-off: seed gh_assets from the newest snapshot in the old
// downloads_history table, so tracking starts on 2026-09-28 rather than on
// the day the new sync first runs. Safe to re-run — it does nothing once
// gh_assets has rows. downloads_history itself is left untouched.
//
//   node --env-file=.env.local scripts/import-legacy-snapshot.mjs

import { db, ensureSchema } from '../lib/analytics/db.js';
import { fetchReleases, flattenAssets } from '../lib/analytics/github-sync.js';

await ensureSchema();
const sql = db();

const [{ n }] = await sql`SELECT count(*)::int AS n FROM gh_assets`;
if (n > 0) {
  console.log(`gh_assets already has ${n} rows — nothing to import.`);
  process.exit(0);
}

const [{ exists }] = await sql`SELECT to_regclass('public.downloads_history') IS NOT NULL AS exists`;
if (!exists) {
  console.log('No downloads_history table — the first sync will set the baseline instead.');
  process.exit(0);
}

const legacy = await sql`
  SELECT timestamp, release_tag, distribution_name, download_count
  FROM downloads_history
  WHERE timestamp = (SELECT max(timestamp) FROM downloads_history)`;
if (!legacy.length) {
  console.log('downloads_history is empty.');
  process.exit(0);
}

// The old table has no asset ids; match on (tag, file name) against GitHub now.
const current = new Map(flattenAssets(await fetchReleases()).map((a) => [`${a.release_tag}|${a.name}`, a]));
const at = new Date(legacy[0].timestamp).toISOString();

const rows = [];
for (const row of legacy) {
  const asset = current.get(`${row.release_tag}|${row.distribution_name}`);
  if (!asset) {
    console.warn(`skipped ${row.release_tag} ${row.distribution_name}: no longer on GitHub`);
    continue;
  }
  rows.push({ ...asset, count: row.download_count });
}

await sql.query(
  `INSERT INTO gh_assets (asset_id, release_tag, release_published_at, prerelease, name,
                          created_at, first_seen_at, baseline_count, last_count, last_seen_at)
   SELECT asset_id, release_tag, published_at, prerelease, name, created_at, $2, count, count, $2
   FROM jsonb_to_recordset($1::jsonb) AS x(asset_id BIGINT, release_tag TEXT, published_at TIMESTAMPTZ,
                                            prerelease BOOLEAN, name TEXT, created_at TIMESTAMPTZ, count INT)
   ON CONFLICT (asset_id) DO NOTHING`,
  [JSON.stringify(rows), at],
);

console.log(`Imported ${rows.length} assets as the baseline at ${at}.`);
