// Pure data shaping for the dashboard. Everything here runs in the browser so
// buckets are the viewer's own local hours and days.

export const HOUR = 3_600_000;
export const DAY = 86_400_000;

// A snapshot window this short is one scheduler tick: put the whole delta in
// the hour its midpoint falls in. Anything longer is a gap (a missed run, the
// stretch before the first hourly sync) and gets spread evenly across it —
// the honest guess when all we know is "N downloads somewhere in here".
const EXACT_WINDOW = 3 * HOUR;

/* ------------------------------------------------------------------ time */

export function floorTo(ms, unit) {
  const d = new Date(ms);
  if (unit === 'hour') {
    d.setMinutes(0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
    if (unit === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    if (unit === 'month') d.setDate(1);
  }
  return d.getTime();
}

export function step(ms, unit, n = 1) {
  const d = new Date(ms);
  if (unit === 'hour') d.setHours(d.getHours() + n);
  else if (unit === 'day') d.setDate(d.getDate() + n);
  else if (unit === 'week') d.setDate(d.getDate() + 7 * n);
  else d.setMonth(d.getMonth() + n);
  return d.getTime();
}

/** Bucket starts covering [from, to), plus the closing edge. */
export function edges(from, to, unit) {
  const out = [];
  for (let t = floorTo(from, unit); t < to; t = step(t, unit)) out.push(t);
  out.push(step(out[out.length - 1] ?? floorTo(from, unit), unit));
  return out;
}

function locate(edgesArr, ms) {
  let lo = 0;
  let hi = edgesArr.length - 2;
  if (ms < edgesArr[0] || ms >= edgesArr[hi + 1]) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (edgesArr[mid] <= ms) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export const GRANULARITIES = ['hour', 'day', 'week', 'month'];

export function allowedGranularities(from, to) {
  const span = to - from;
  return GRANULARITIES.filter((g) => {
    if (g === 'hour') return span <= 31 * DAY;
    if (g === 'day') return span >= 2 * DAY && span <= 731 * DAY;
    if (g === 'week') return span >= 21 * DAY;
    return span >= 90 * DAY;
  });
}

export function autoGranularity(from, to) {
  const span = to - from;
  if (span <= 3 * DAY) return 'hour';
  if (span <= 120 * DAY) return 'day';
  if (span <= 540 * DAY) return 'week';
  return 'month';
}

export const PRESETS = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 3 months' },
  { id: '12m', label: 'Last 12 months' },
  { id: 'all', label: 'All time' },
];

export function presetRange(id, now, earliest) {
  if (id === '24h') {
    const to = floorTo(now, 'hour') + HOUR;
    return { from: to - 24 * HOUR, to };
  }
  const to = step(floorTo(now, 'day'), 'day');
  const days = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }[id];
  if (days) return { from: step(to, 'day', -days), to };
  return { from: floorTo(earliest ?? now - 30 * DAY, 'day'), to };
}

/* ------------------------------------------------------------- downloads */

/**
 * Flatten snapshot events into per-hour units: [hourStart, assetIndex, amount,
 * estimated]. Long windows become many fractional units; sums are exact.
 */
export function downloadUnits(events) {
  const units = [];
  for (const [asset, since, at, delta] of events) {
    if (asset == null) continue;
    const span = at - since;
    if (span <= EXACT_WINDOW) {
      units.push([floorTo(since + span / 2, 'hour'), asset, delta, false]);
      continue;
    }
    for (let h = floorTo(since, 'hour'); h < at; h = step(h, 'hour')) {
      const overlap = Math.min(at, step(h, 'hour')) - Math.max(since, h);
      if (overlap > 0) units.push([h, asset, (delta * overlap) / span, true]);
    }
  }
  return units;
}

/** Which assets survive the active filters, optionally ignoring one dimension. */
export function assetMask(assets, filters, ignore) {
  return assets.map((a) =>
    Object.entries(filters).every(([dim, value]) => dim === ignore || value == null || assetValue(a, dim) === value),
  );
}

export function assetValue(asset, dim) {
  if (dim === 'kind') return asset.kind;
  if (dim === 'platform') return asset.platform;
  if (dim === 'arch') return asset.arch ?? 'unknown';
  if (dim === 'format') return asset.format;
  if (dim === 'tag') return asset.tag;
  if (dim === 'name') return asset.name;
  return null;
}

export function downloadSeries(units, mask, edgesArr) {
  const values = new Float64Array(edgesArr.length - 1);
  const estimated = new Float64Array(edgesArr.length - 1);
  for (const [hour, asset, amount, est] of units) {
    if (!mask[asset]) continue;
    const i = locate(edgesArr, hour);
    if (i < 0) continue;
    values[i] += amount;
    if (est) estimated[i] += amount;
  }
  return { values: Array.from(values), estimated: Array.from(estimated) };
}

export function downloadTotal(units, mask, from, to) {
  let sum = 0;
  for (const [hour, asset, amount] of units) if (mask[asset] && hour >= from && hour < to) sum += amount;
  return sum;
}

/** Ranked rows for one breakdown panel. */
export function downloadBreakdown(units, assets, mask, dim, from, to) {
  const totals = new Map();
  for (const [hour, asset, amount] of units) {
    if (!mask[asset] || hour < from || hour >= to) continue;
    const key = assetValue(assets[asset], dim);
    totals.set(key, (totals.get(key) ?? 0) + amount);
  }
  return [...totals]
    .map(([key, value]) => ({ key, value }))
    .filter((r) => r.value >= 0.5)
    .sort((a, b) => b.value - a.value);
}

/**
 * Lifetime rows for one breakdown: each asset's current counter, which
 * includes everything downloaded before tracking began. No dates, exact sums.
 */
export function lifetimeBreakdown(assets, mask, dim) {
  const totals = new Map();
  assets.forEach((a, i) => {
    if (!mask[i] || !a.total) return;
    const key = assetValue(a, dim);
    totals.set(key, (totals.get(key) ?? 0) + a.total);
  });
  return [...totals].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}

/** Per-platform split of one bucket, for the chart tooltip. */
export function bucketSplit(units, assets, mask, start, end) {
  const out = {};
  for (const [hour, asset, amount] of units) {
    if (!mask[asset] || hour < start || hour >= end) continue;
    const p = assets[asset].platform;
    out[p] = (out[p] ?? 0) + amount;
  }
  return out;
}

/* --------------------------------------------------------------- traffic */

// Vercel buckets by UTC hour. In a half-hour zone (India is +5:30) a UTC hour
// straddles two local hours; it is filed under the one it starts in.
export function trafficSeries(traffic, edgesArr) {
  const pageviews = new Array(edgesArr.length - 1).fill(0);
  const visitors = new Array(edgesArr.length - 1).fill(0);
  for (const [hour, pv, v] of traffic) {
    const i = locate(edgesArr, hour);
    if (i < 0) continue;
    pageviews[i] += pv;
    visitors[i] += v;
  }
  return { pageviews, visitors };
}

export function trafficTotal(traffic, from, to) {
  let pageviews = 0;
  let visitors = 0;
  for (const [hour, pv, v] of traffic) {
    if (hour >= from && hour < to) {
      pageviews += pv;
      visitors += v;
    }
  }
  return { pageviews, visitors };
}

/** Breakdown rows are UTC days; a day counts if its midpoint is in range. */
export function trafficBreakdown(rows, dimension, from, to) {
  const totals = new Map();
  for (const [day, dim, value, pv, v] of rows) {
    if (dim !== dimension) continue;
    const mid = Date.parse(`${day}T12:00:00Z`);
    if (mid < from || mid >= to) continue;
    const t = totals.get(value) ?? { pageviews: 0, visitors: 0 };
    t.pageviews += pv;
    t.visitors += v;
    totals.set(value, t);
  }
  return [...totals]
    .map(([key, t]) => ({ key, value: t.visitors, pageviews: t.pageviews }))
    .sort((a, b) => (a.key === 'Others') - (b.key === 'Others') || b.value - a.value);
}

/* ------------------------------------------------------------ formatting */

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const fmt = (n) => whole.format(Math.round(n));
export const fmtCompact = (n) => (Math.abs(n) < 1000 ? whole.format(n) : compact.format(n));
export const fmtRate = (n) => `${n.toFixed(n < 10 ? 1 : 0)}%`;

export function fmtBucket(start, end, unit) {
  const d = new Date(start);
  if (unit === 'hour') {
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const t = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day} · ${t(start)} – ${t(end)}`;
  }
  if (unit === 'day') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  if (unit === 'week') {
    const last = new Date(end - 1);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function fmtTick(ms, unit, spanDays) {
  const d = new Date(ms);
  if (unit === 'hour') {
    if (d.getHours() === 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleTimeString('en-US', { hour: 'numeric' });
  }
  if (unit === 'month' || spanDays > 400) return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtRange(from, to) {
  const opts = { month: 'short', day: 'numeric' };
  const a = new Date(from);
  const b = new Date(to - 1);
  const sameYear = a.getFullYear() === b.getFullYear() && a.getFullYear() === new Date().getFullYear();
  if (!sameYear) Object.assign(opts, { year: 'numeric' });
  if (to - from <= DAY && a.getDate() === b.getDate()) {
    return `${a.toLocaleDateString('en-US', opts)}, ${a.toLocaleTimeString('en-US', { hour: 'numeric' })} – ${new Date(to).toLocaleTimeString('en-US', { hour: 'numeric' })}`;
  }
  return `${a.toLocaleDateString('en-US', opts)} – ${b.toLocaleDateString('en-US', opts)}`;
}

export function timeAgo(ms, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/**
 * 1 / 2 / 5 × 10ⁿ steps, so every gridline is a round number. Counts never
 * get a fractional step — a "2.5 downloads" tick would print as 3.
 */
export function niceScale(max, ticks = 4, integer = true) {
  if (!(max > 0)) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  let s = [1, 2, 5, 10].map((m) => m * pow).find((c) => c >= raw);
  if (integer) s = Math.max(1, Math.round(s));
  return { top: Math.ceil(max / s - 1e-9) * s, step: s };
}
