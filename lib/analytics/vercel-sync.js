import { db } from './db.js';

// The public Web Analytics API (May 2026). It answers from the same data as
// the dashboard, and only within the plan's reporting window — 30 days on
// Hobby. Everything copied out of it into Postgres stays forever, which is
// the point of this file.
const API = 'https://api.vercel.com/v1/query/web-analytics/visits/aggregate';

// Not secrets: these are the IDs in .vercel/project.json. Env wins so a
// transfer to another team or project is a config change, not a code change.
const PROJECT_ID = process.env.VERCEL_ANALYTICS_PROJECT_ID ?? 'prj_PA7T3LhtCUtBCf2ztuoqZLmOfAxB';
const TEAM_ID = process.env.VERCEL_ANALYTICS_TEAM_ID ?? 'team_p9p05zepgDCuRfy2T9LEUU1g';

// Each is stored per UTC day. Vercel caps a breakdown at `limit` values and
// folds the rest into "Others", which is kept so totals still add up.
export const DIMENSIONS = [
  'requestPath',
  'referrerHostname',
  'country',
  'deviceType',
  'osName',
  'browserName',
  'utmSource',
];

const DAY = 86_400_000;
const HOUR = 3_600_000;

export function webAnalyticsConfigured() {
  return Boolean(process.env.VERCEL_ANALYTICS_TOKEN);
}

async function query(params, attempt = 0) {
  const url = new URL(API);
  url.searchParams.set('projectId', PROJECT_ID);
  if (TEAM_ID) url.searchParams.set('teamId', TEAM_ID);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ANALYTICS_TOKEN}` },
    cache: 'no-store',
  });

  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    const wait = Number(res.headers.get('retry-after')) * 1000 || 1000 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, Math.min(wait, 15_000)));
    return query(params, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Web Analytics API ${res.status} for by=${params.by}: ${(await res.text()).slice(0, 300)}`);
  }
  const body = await res.json();
  return Array.isArray(body.data) ? body.data : [];
}

/** Runs `fn` over `items` with at most `n` in flight — the API is rate limited. */
async function pool(items, n, fn) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

const utcDay = (ms) => Math.floor(ms / DAY) * DAY;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * Copy hourly traffic and per-day breakdowns for [fromDay, today] into
 * Postgres. Rows are replaced, not merged: the API is the source of truth for
 * every day still inside its window, and today keeps filling in until it ends.
 */
export async function syncWebAnalytics({ backfillDays = 30, overlapDays = 2, now = Date.now() } = {}) {
  const sql = db();

  // First run: reach back as far as the plan allows. After that, re-read the
  // last couple of days (late-arriving events) and anything since the last
  // successful copy, so a week of missed runs still self-heals.
  const [{ latest }] = await sql`SELECT max(hour) AS latest FROM web_hourly`;
  const today = utcDay(now);
  const from = latest
    ? Math.max(utcDay(new Date(latest).getTime()) - overlapDays * DAY, today - backfillDays * DAY)
    : today - backfillDays * DAY;

  const days = [];
  for (let d = from; d <= today; d += DAY) days.push(d);

  // Hourly series, in 3-day chunks so no response can approach the 100-row cap.
  const chunks = [];
  for (let d = from; d <= today; d += 3 * DAY) chunks.push([d, Math.min(d + 3 * DAY, today + DAY) - 1]);

  const errors = [];
  const failedDays = new Set();
  const hourly = (
    await pool(chunks, 3, ([since, until]) =>
      query({ by: 'hour', since: new Date(since).toISOString(), until: new Date(until).toISOString(), limit: 100 }).catch(
        (e) => (errors.push(e.message), []),
      ),
    )
  ).flat();

  const breakdownJobs = days.flatMap((day) => DIMENSIONS.map((dimension) => ({ day, dimension })));
  const breakdown = (
    await pool(breakdownJobs, 4, async ({ day, dimension }) => {
      try {
        const data = await query({
          by: dimension,
          since: new Date(day).toISOString(),
          until: new Date(day + DAY - 1).toISOString(),
          limit: 100,
        });
        return data.map((row) => ({
          day: isoDay(day),
          dimension,
          value: row[dimension] == null || row[dimension] === '' ? '' : String(row[dimension]),
          pageviews: Number(row.pageviews) || 0,
          visitors: Number(row.visitors) || 0,
        }));
      } catch (e) {
        errors.push(e.message);
        failedDays.add(isoDay(day)); // keep whatever we already stored for this day
        return null;
      }
    })
  )
    .filter(Boolean)
    .flat();

  const hours = hourly
    .filter((row) => row.timestamp)
    .map((row) => ({
      hour: new Date(Math.floor(new Date(row.timestamp).getTime() / HOUR) * HOUR).toISOString(),
      pageviews: Number(row.pageviews) || 0,
      visitors: Number(row.visitors) || 0,
    }));

  // Only replace days whose every dimension came back; a partial day keeps
  // what it had rather than losing rows to a transient error.
  const complete = days.map(isoDay).filter((day) => !failedDays.has(day));

  const statements = [];
  if (hours.length) {
    statements.push(
      sql.query(
        `INSERT INTO web_hourly (hour, pageviews, visitors)
         SELECT hour, pageviews, visitors
         FROM jsonb_to_recordset($1::jsonb) AS x(hour TIMESTAMPTZ, pageviews INT, visitors INT)
         ON CONFLICT (hour) DO UPDATE SET pageviews = EXCLUDED.pageviews, visitors = EXCLUDED.visitors`,
        [JSON.stringify(hours)],
      ),
    );
  }
  if (complete.length) {
    statements.push(sql.query('DELETE FROM web_breakdown WHERE day = ANY($1::date[])', [complete]));
    const rows = breakdown.filter((row) => complete.includes(row.day));
    if (rows.length) {
      statements.push(
        sql.query(
          `INSERT INTO web_breakdown (day, dimension, value, pageviews, visitors)
           SELECT day, dimension, value, sum(pageviews), sum(visitors)
           FROM jsonb_to_recordset($1::jsonb) AS x(day DATE, dimension TEXT, value TEXT, pageviews INT, visitors INT)
           GROUP BY day, dimension, value`,
          [JSON.stringify(rows)],
        ),
      );
    }
  }
  if (statements.length) await sql.transaction(statements);

  if (!hours.length && errors.length) throw new Error(errors[0]);

  return {
    from: isoDay(from),
    to: isoDay(today),
    hours: hours.length,
    breakdownRows: breakdown.length,
    partialDays: [...failedDays],
    errors: errors.slice(0, 5),
  };
}
