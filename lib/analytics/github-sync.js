import { REPO } from '../site.js';
import { db } from './db.js';

/** Every release, every page. GitHub defaults to 30 per page and stops there. */
export async function fetchReleases() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  // Optional: 60 unauthenticated calls an hour is plenty for an hourly sync,
  // but a token makes it 5,000 and keeps a shared egress IP from starving us.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const releases = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const batch = await res.json();
    releases.push(...batch);
    if (batch.length < 100) break;
  }
  return releases.filter((release) => !release.draft);
}

export function flattenAssets(releases) {
  return releases.flatMap((release) =>
    (release.assets ?? []).map((asset) => ({
      asset_id: asset.id,
      release_tag: release.tag_name,
      published_at: release.published_at,
      prerelease: release.prerelease,
      name: asset.name,
      created_at: asset.created_at,
      count: asset.download_count,
    })),
  );
}

/**
 * Take one snapshot of every asset's download counter and record what moved.
 *
 * Both statements run in one transaction. The UPDATE takes a row lock on each
 * asset and reads the previous count through RETURNING old.* (Postgres 18), so
 * two overlapping runs — the hourly workflow and the daily Vercel cron landing
 * together — serialise on those locks and the second sees a delta of zero
 * instead of counting the same downloads twice.
 */
export async function snapshotDownloads(assets, now = new Date()) {
  const sql = db();
  const at = now.toISOString();
  const rows = JSON.stringify(assets);

  const [, events] = await sql.transaction([
    // New assets. On the very first snapshot everything already downloaded is
    // a baseline with no timestamps. After that a new asset started at zero
    // when its release went public, so its whole count is new — and since we
    // know when that was, it lands on the chart.
    sql.query(
      `WITH prior AS (SELECT EXISTS (SELECT 1 FROM gh_assets) AS has_prior)
       INSERT INTO gh_assets (asset_id, release_tag, release_published_at, prerelease, name,
                              created_at, first_seen_at, baseline_count, last_count, last_seen_at)
       SELECT x.asset_id, x.release_tag, x.published_at, x.prerelease, x.name, x.created_at, $2,
              CASE WHEN prior.has_prior THEN 0 ELSE x.count END,
              CASE WHEN prior.has_prior THEN 0 ELSE x.count END,
              CASE WHEN prior.has_prior THEN GREATEST(x.created_at, COALESCE(x.published_at, x.created_at)) ELSE $2 END
       FROM jsonb_to_recordset($1::jsonb) AS x(asset_id BIGINT, release_tag TEXT, published_at TIMESTAMPTZ,
                                                prerelease BOOLEAN, name TEXT, created_at TIMESTAMPTZ, count INT),
            prior
       ON CONFLICT (asset_id) DO UPDATE SET
         release_tag = EXCLUDED.release_tag,
         release_published_at = EXCLUDED.release_published_at,
         prerelease = EXCLUDED.prerelease,
         name = EXCLUDED.name`,
      [rows, at],
    ),
    // Every asset's clock moves forward on every run, changed or not: if a
    // count is flat at 13:00 and 14:00 and up at 15:00, those downloads
    // happened after 14:00, not after 13:00.
    sql.query(
      `WITH x AS (
         SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(asset_id BIGINT, count INT)
       ), moved AS (
         UPDATE gh_assets a
         SET last_count = GREATEST(a.last_count, x.count), last_seen_at = $2
         FROM x
         WHERE a.asset_id = x.asset_id AND a.last_seen_at < $2
         RETURNING a.asset_id, old.last_count AS prev, x.count AS cur, old.last_seen_at AS since
       )
       INSERT INTO gh_download_events (asset_id, since, observed_at, delta, total)
       SELECT asset_id, since, $2, cur - prev, cur FROM moved WHERE cur > prev
       RETURNING asset_id, delta`,
      [rows, at],
    ),
  ]);

  return {
    assets: assets.length,
    events: events.length,
    downloads: events.reduce((sum, e) => sum + e.delta, 0),
  };
}
