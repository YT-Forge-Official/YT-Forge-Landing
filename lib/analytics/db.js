import { neon } from '@neondatabase/serverless';

// Neon over HTTP: one round trip per query, no pool to leak between
// serverless invocations. @vercel/postgres is deprecated and was a wrapper
// around this same driver anyway.
let client;
export function db() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  client ??= neon(url);
  return client;
}

// Additive and idempotent, so every cold start can run it safely. Changing a
// table means a new statement here, never an edit to an old one.
const SCHEMA = [
  // One row per release asset, carrying the last count we saw and when.
  // baseline_count is what the asset had already been downloaded when
  // tracking began — real, but with no timestamps to put on a chart.
  `CREATE TABLE IF NOT EXISTS gh_assets (
     asset_id        BIGINT PRIMARY KEY,
     release_tag     TEXT NOT NULL,
     release_published_at TIMESTAMPTZ,
     prerelease      BOOLEAN NOT NULL DEFAULT FALSE,
     name            TEXT NOT NULL,
     created_at      TIMESTAMPTZ NOT NULL,
     first_seen_at   TIMESTAMPTZ NOT NULL,
     baseline_count  INTEGER NOT NULL,
     last_count      INTEGER NOT NULL,
     last_seen_at    TIMESTAMPTZ NOT NULL
   )`,
  // Only written when a count moves. `delta` downloads happened somewhere in
  // (since, observed_at] — an hour when the scheduler is healthy, longer
  // across a gap. The dashboard decides how to place them inside that window.
  `CREATE TABLE IF NOT EXISTS gh_download_events (
     asset_id     BIGINT NOT NULL REFERENCES gh_assets (asset_id),
     since        TIMESTAMPTZ NOT NULL,
     observed_at  TIMESTAMPTZ NOT NULL,
     delta        INTEGER NOT NULL,
     total        INTEGER NOT NULL,
     PRIMARY KEY (asset_id, observed_at)
   )`,
  `CREATE INDEX IF NOT EXISTS gh_download_events_observed_at ON gh_download_events (observed_at)`,
  // Vercel Web Analytics, copied out before the plan's reporting window
  // forgets it. Hourly totals are UTC hours, exactly as the API buckets them.
  `CREATE TABLE IF NOT EXISTS web_hourly (
     hour       TIMESTAMPTZ PRIMARY KEY,
     pageviews  INTEGER NOT NULL,
     visitors   INTEGER NOT NULL
   )`,
  // Top values per UTC day for each dimension (pages, referrers, countries…).
  `CREATE TABLE IF NOT EXISTS web_breakdown (
     day        DATE NOT NULL,
     dimension  TEXT NOT NULL,
     value      TEXT NOT NULL,
     pageviews  INTEGER NOT NULL,
     visitors   INTEGER NOT NULL,
     PRIMARY KEY (day, dimension, value)
   )`,
  `CREATE TABLE IF NOT EXISTS sync_runs (
     id           SERIAL PRIMARY KEY,
     source       TEXT NOT NULL,
     trigger      TEXT,
     started_at   TIMESTAMPTZ NOT NULL,
     finished_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     ok           BOOLEAN NOT NULL,
     detail       JSONB
   )`,
  `CREATE INDEX IF NOT EXISTS sync_runs_source_finished ON sync_runs (source, finished_at DESC)`,
];

let ready;
export function ensureSchema() {
  ready ??= (async () => {
    const sql = db();
    for (const statement of SCHEMA) await sql.query(statement);
  })().catch((error) => {
    ready = undefined; // let the next call retry instead of caching the failure
    throw error;
  });
  return ready;
}

export async function logRun(source, trigger, startedAt, ok, detail) {
  await db().query(
    'INSERT INTO sync_runs (source, trigger, started_at, ok, detail) VALUES ($1, $2, $3, $4, $5)',
    [source, trigger, startedAt, ok, JSON.stringify(detail)],
  );
}
