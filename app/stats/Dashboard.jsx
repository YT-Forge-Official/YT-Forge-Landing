'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, RefreshCw, Table2, X, ChartColumn } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AppleIcon, LinuxIcon, WindowsIcon } from '@/components/icons';
import { clsx } from '@/lib/clsx';
import { KINDS, PLATFORMS } from '@/lib/analytics/assets';
import { Chart } from './Chart';
import { Breakdown, RangeMenu, Segmented, useSlider } from './controls';
import {
  DAY,
  PRESETS,
  allowedGranularities,
  assetMask,
  autoGranularity,
  bucketSplit,
  downloadBreakdown,
  downloadSeries,
  downloadTotal,
  downloadUnits,
  edges as makeEdges,
  fmt,
  fmtBucket,
  fmtCompact,
  fmtRange,
  fmtRate,
  lifetimeBreakdown,
  presetRange,
  timeAgo,
  trafficBreakdown,
  trafficSeries,
  trafficTotal,
} from './model';

const METRICS = [
  { id: 'downloads', label: 'Downloads', mode: 'bar' },
  { id: 'visitors', label: 'Visitors', mode: 'area' },
  { id: 'pageviews', label: 'Page views', mode: 'area' },
  { id: 'rate', label: 'Download rate', mode: 'area' },
];

const FILTER_LABELS = { kind: 'Type', platform: 'Platform', arch: 'Arch', format: 'Format', tag: 'Version', name: 'File' };
// Every file GitHub counts, matching the release page's own total. The Type
// panel splits it into installers, updates and update checks.
const DEFAULT_FILTERS = {};

const PlatformIcon = ({ platform, className = 'size-3.5 shrink-0 text-ink-3' }) =>
  platform === 'mac' ? (
    <AppleIcon className={className} />
  ) : platform === 'windows' ? (
    <WindowsIcon className={className} />
  ) : platform === 'linux' ? (
    <LinuxIcon className={className} />
  ) : null;

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
const flag = (code) =>
  /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌐';
const countryName = (code) => {
  try {
    return (code && regionNames?.of(code)) || code || 'Unknown';
  } catch {
    return code;
  }
};
const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown');

/* ======================================================================== */

export default function Dashboard({ data, initial }) {
  // Everything below buckets by the viewer's local clock, which the server
  // doesn't know. Render the frame on the server and the numbers after mount.
  const [now, setNow] = useState(null);
  useEffect(() => setNow(Date.now()), []);
  if (!now) return <Shell data={data} />;
  return <Live data={data} initial={initial} now={now} />;
}

function Shell({ data }) {
  return (
    <div className="stats-page">
      <Header data={data} />
      <div className="panel stats-card mt-6 h-[480px] animate-pulse opacity-60" />
    </div>
  );
}

function Header({ data, syncing, onSync, now }) {
  const gh = data.runs.github;
  const stale = gh && now && now - gh.at > 3 * 3_600_000;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <a href="/" className="transition-opacity hover:opacity-80" aria-label="YT-FORGE home">
          <Logo size={28} />
        </a>
        <span className="text-ink-4 text-[18px] font-light">/</span>
        <h1 className="text-[18px] font-medium tracking-[-0.02em]">Analytics</h1>
      </div>
      <div className="flex items-center gap-3 text-[13px] text-ink-3">
        {gh && (
          <span className="flex items-center gap-2" title={new Date(gh.at).toLocaleString()}>
            <span className={clsx('stats-pulse', (!gh.ok || stale) && 'is-warn')} />
            {gh.ok ? 'Synced' : 'Last sync failed'} {now ? timeAgo(gh.at, now) : ''}
          </span>
        )}
        {onSync && (
          <button type="button" className="stats-control" onClick={onSync} disabled={syncing}>
            <RefreshCw className={clsx('size-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing' : 'Sync now'}
          </button>
        )}
      </div>
    </header>
  );
}

/* ======================================================================== */

function Live({ data, initial, now }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const units = useMemo(() => downloadUnits(data.events), [data.events]);
  const earliest = useMemo(() => {
    const candidates = [data.trackingSince, data.traffic[0]?.[0], units[0]?.[0]].filter(Boolean);
    return candidates.length ? Math.min(...candidates) : now - 30 * DAY;
  }, [data, units, now]);

  // ----- view state (mirrored into the URL so a refresh keeps the view)
  const [view, setView] = useState(() => {
    const a = Number(initial.from);
    const b = Number(initial.to);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return { preset: 'custom', from: a, to: b };
    const preset = PRESETS.some((p) => p.id === initial.range) ? initial.range : '30d';
    return { preset, ...presetRange(preset, now, earliest) };
  });
  const [back, setBack] = useState([]);
  const [unitChoice, setUnitChoice] = useState(initial.unit ?? null);
  const [metric, setMetric] = useState(METRICS.some((m) => m.id === initial.metric) ? initial.metric : 'downloads');
  const [filters, setFilters] = useState(() => {
    const f = { ...DEFAULT_FILTERS };
    for (const key of Object.keys(FILTER_LABELS)) if (initial[key] !== undefined) f[key] = initial[key] || null;
    return f;
  });
  const [table, setTable] = useState(false);

  const { from, to } = view;
  const allowed = allowedGranularities(from, to);
  const unit = unitChoice && allowed.includes(unitChoice) ? unitChoice : autoGranularity(from, to);

  useEffect(() => {
    const p = new URLSearchParams();
    if (view.preset === 'custom') {
      p.set('from', String(from));
      p.set('to', String(to));
    } else if (view.preset !== '30d') p.set('range', view.preset);
    if (unitChoice) p.set('unit', unitChoice);
    if (metric !== 'downloads') p.set('metric', metric);
    for (const key of Object.keys(FILTER_LABELS)) {
      if ((filters[key] ?? null) !== (DEFAULT_FILTERS[key] ?? null)) p.set(key, filters[key] ?? '');
    }
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [view, from, to, unitChoice, metric, filters]);

  const goTo = useCallback(
    (next) => {
      setBack((b) => [...b.slice(-20), view]);
      setView(next);
    },
    [view],
  );
  const zoom = (a, b) => goTo({ preset: 'custom', from: a, to: b });
  const drill = (a, b) => {
    // A day opens as its 24 hours, a week as its days, a month as its days.
    setUnitChoice(null);
    zoom(a, b);
  };

  // ----- derived data
  const edges = useMemo(() => makeEdges(from, to, unit), [from, to, unit]);
  const span = to - from;
  const prev = { from: from - span, to: from };

  const mask = useMemo(() => assetMask(data.assets, filters), [data.assets, filters]);
  const dl = useMemo(() => downloadSeries(units, mask, edges), [units, mask, edges]);
  const web = useMemo(() => trafficSeries(data.traffic, edges), [data.traffic, edges]);
  const rate = useMemo(
    () => dl.values.map((d, i) => (web.visitors[i] ? (d / web.visitors[i]) * 100 : 0)),
    [dl, web],
  );

  const totals = useMemo(() => {
    const cur = trafficTotal(data.traffic, from, to);
    const old = trafficTotal(data.traffic, prev.from, prev.to);
    const d = downloadTotal(units, mask, from, to);
    const dOld = downloadTotal(units, mask, prev.from, prev.to);
    return {
      downloads: [d, dOld],
      visitors: [cur.visitors, old.visitors],
      pageviews: [cur.pageviews, old.pageviews],
      rate: [cur.visitors ? (d / cur.visitors) * 100 : null, old.visitors ? (dOld / old.visitors) * 100 : null],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.traffic, units, mask, from, to]);

  // Before-tracking and lifetime figures respect the same filters.
  const lifetime = useMemo(() => {
    let total = 0;
    let baseline = 0;
    data.assets.forEach((a, i) => {
      if (!mask[i]) return;
      total += a.total;
      baseline += a.baseline;
    });
    return { total, baseline };
  }, [data.assets, mask]);

  const hasTrafficData = data.traffic.some(([t]) => t >= prev.from && t < to);
  const hasPrev = (id) =>
    id === 'downloads' ? data.trackingSince != null && data.trackingSince <= prev.from : data.traffic.length && data.traffic[0][0] <= prev.from;

  // ----- sync
  const sync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/stats/sync', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      const err = body.github?.error || body.web?.error;
      if (!res.ok || err) setSyncError(err || `Sync failed (${res.status})`);
      startRefresh(() => router.refresh());
    } catch (e) {
      setSyncError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  // ----- chart config for the active metric
  const series = metric === 'downloads' ? dl.values : metric === 'rate' ? rate : web[metric];
  const metricDef = METRICS.find((m) => m.id === metric);
  const isTraffic = metric !== 'downloads';
  const chartEmpty =
    isTraffic && !data.webConfigured
      ? 'Connect Vercel Web Analytics to see traffic — see the setup notes below.'
      : !series.some((v) => v > 0)
        ? `No ${metricDef.label.toLowerCase()} in this range`
        : null;

  const renderTip = (i) => {
    const start = edges[i];
    const end = edges[i + 1];
    const v = series[i];
    const est = metric === 'downloads' && dl.estimated[i] > 0.01;
    const split = metric === 'downloads' ? bucketSplit(units, data.assets, mask, start, end) : null;
    return (
      <>
        <p className="chart-tip-label">{fmtBucket(start, end, unit)}</p>
        <p className="chart-tip-value">
          {metric === 'rate' ? fmtRate(v) : `${est ? '~' : ''}${fmt(v)}`}
          <span>{metric === 'rate' ? 'downloads / visitors' : metricDef.label.toLowerCase()}</span>
        </p>
        {split && Object.keys(split).length > 1 && (
          <ul className="chart-tip-split">
            {Object.entries(split)
              .sort((a, b) => b[1] - a[1])
              .map(([p, n]) => (
                <li key={p}>
                  <PlatformIcon platform={p} />
                  <span>{PLATFORMS[p]}</span>
                  <b>{est ? '~' : ''}{fmt(n)}</b>
                </li>
              ))}
          </ul>
        )}
        {metric === 'rate' && (
          <p className="chart-tip-note">
            {fmt(dl.values[i])} downloads · {fmt(web.visitors[i])} visitors
          </p>
        )}
        {est && <p className="chart-tip-note">Estimated: spread evenly across a gap between syncs.</p>}
        {unit !== 'hour' && <p className="chart-tip-hint">Click to zoom in</p>}
      </>
    );
  };

  // ----- breakdowns
  // "All time" means all of it: panels switch to lifetime counters, which
  // include the downloads from before tracking that have no dates.
  const isAll = view.preset === 'all';
  const dlPanel = (dim) => {
    const m = assetMask(data.assets, filters, dim);
    const rows = isAll ? lifetimeBreakdown(data.assets, m, dim) : downloadBreakdown(units, data.assets, m, dim, from, to);
    return rows.map((r) => ({ ...r, approx: !isAll }));
  };
  const pick = (dim, value) => setFilters((f) => ({ ...f, [dim]: value }));
  const releases = useMemo(() => new Map(data.assets.map((a) => [a.tag, a])), [data.assets]);

  const platformRows = dlPanel('platform').map((r) => ({
    ...r,
    label: PLATFORMS[r.key] ?? r.key,
    icon: <PlatformIcon platform={r.key} />,
  }));
  const archRows = dlPanel('arch').map((r) => ({ ...r, label: r.key === 'universal' ? 'Universal (x64 + ARM)' : r.key }));
  const formatRows = dlPanel('format').map((r) => ({ ...r, label: r.key, mono: true }));
  const kindRows = dlPanel('kind').map((r) => ({ ...r, label: KINDS[r.key] ?? r.key }));
  const tagRows = dlPanel('tag').map((r) => ({
    ...r,
    label: r.key,
    mono: true,
    badge: releases.get(r.key)?.prerelease ? 'pre' : null,
  }));
  const fileRows = dlPanel('name').map((r) => {
    const a = data.assets.find((x) => x.name === r.key);
    return { ...r, label: r.key, mono: true, icon: <PlatformIcon platform={a?.platform} /> };
  });

  const tb = (dim) => trafficBreakdown(data.breakdown, dim, from, to);
  const pageRows = tb('requestPath').map((r) => ({ ...r, label: r.key || '/', mono: true }));
  const refRows = tb('referrerHostname').map((r) => ({ ...r, label: r.key || 'Direct / none' }));
  const utmRows = tb('utmSource').filter((r) => r.key).map((r) => ({ ...r, label: r.key }));
  const countryRows = tb('country').map((r) => ({
    ...r,
    label: r.key === 'Others' ? 'Others' : countryName(r.key),
    icon: <span className="w-4 text-center text-[13px] leading-none">{r.key === 'Others' ? '·' : flag(r.key)}</span>,
  }));
  const deviceRows = tb('deviceType').map((r) => ({ ...r, label: titleCase(r.key) }));
  const osRows = tb('osName').map((r) => ({ ...r, label: r.key || 'Unknown' }));
  const browserRows = tb('browserName').map((r) => ({ ...r, label: r.key || 'Unknown' }));

  const activeFilters = Object.entries(filters).filter(([, v]) => v != null);
  const rangeLabel = view.preset === 'custom' ? fmtRange(from, to) : PRESETS.find((p) => p.id === view.preset)?.label;
  const trafficEmpty = data.webConfigured ? 'No traffic stored for this range' : 'Web Analytics not connected';

  return (
    <div className={clsx('stats-page', refreshing && 'is-refreshing')}>
      <Header data={data} syncing={syncing || refreshing} onSync={sync} now={now} />
      {syncError && (
        <p className="mt-4 rounded-[var(--radius-control)] border border-err/30 bg-err/10 px-3 py-2 text-[13px] text-err">
          {syncError}
        </p>
      )}

      <Lifetime data={data} filters={filters} />

      {/* ---------------------------------------------------- toolbar */}
      <div className="stats-toolbar">
        <div className="flex flex-wrap items-center gap-2">
          {back.length > 0 && (
            <button
              type="button"
              className="stats-control"
              onClick={() => {
                setView(back[back.length - 1]);
                setBack((b) => b.slice(0, -1));
              }}
              aria-label="Back to previous range"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <RangeMenu
            preset={view.preset}
            label={rangeLabel}
            range={view}
            onPreset={(id) => goTo({ preset: id, ...presetRange(id, Date.now(), earliest) })}
            onCustom={(a, b) => goTo({ preset: 'custom', from: a, to: b })}
          />
          <Segmented
            label="Granularity"
            value={unit}
            onChange={setUnitChoice}
            items={['hour', 'day', 'week', 'month'].map((g) => ({
              id: g,
              label: titleCase(g),
              disabled: !allowed.includes(g),
            }))}
          />
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map(([dim, value]) => (
              <button key={dim} type="button" className="stats-chip" onClick={() => pick(dim, null)}>
                <span className="text-ink-3">{FILTER_LABELS[dim]}</span>
                <span>{dim === 'kind' ? KINDS[value] : dim === 'platform' ? PLATFORMS[value] : value}</span>
                <X className="size-3.5 text-ink-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- headline */}
      <section className="panel stats-card mt-4 overflow-hidden">
        <KpiTabs
          metric={metric}
          onChange={setMetric}
          tiles={METRICS.map((m) => {
            const [cur, old] = totals[m.id];
            const traffic = m.id !== 'downloads';
            const missing = traffic && (!data.webConfigured || !hasTrafficData);
            return {
              ...m,
              value:
                m.id === 'downloads' && isAll
                  ? fmt(lifetime.total)
                  : missing || cur == null
                    ? '—'
                    : m.id === 'rate'
                      ? fmtRate(cur)
                      : fmt(cur),
              delta:
                !(m.id === 'downloads' && isAll) && !missing && hasPrev(m.id) && old > 0 && cur != null
                  ? (cur - old) / old
                  : null,
              sub:
                m.id === 'downloads'
                  ? isAll
                    ? `${fmt(cur)} with dates on the chart`
                    : `${fmtCompact(lifetime.total)} all time`
                  : m.id === 'rate'
                    ? 'downloads ÷ visitors'
                    : null,
            };
          })}
        />

        <div className="px-3 pt-4 pb-2 sm:px-5">
          {table ? (
            <BucketTable edges={edges} unit={unit} series={series} metric={metric} estimated={dl.estimated} />
          ) : (
            <Chart
              key={metric}
              edges={edges}
              values={series}
              estimated={metric === 'downloads' ? dl.estimated : null}
              unit={unit}
              mode={metricDef.mode}
              formatValue={metric === 'rate' ? (v) => `${fmtCompact(v)}%` : undefined}
              renderTip={renderTip}
              onSelectRange={zoom}
              onDrill={drill}
              canDrill={unit !== 'hour'}
              empty={chartEmpty}
              integer={metric !== 'rate'}
              coverageFrom={
                metric === 'downloads'
                  ? data.trackingSince
                  : metric === 'rate'
                    ? Math.max(data.trackingSince ?? Infinity, data.traffic[0]?.[0] ?? Infinity)
                    : data.traffic[0]?.[0]
              }
            />
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle px-5 py-3 text-[12px] text-ink-4">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Drag across the chart to zoom · click a bar for detail</span>
            {metric === 'downloads' && dl.estimated.some((v) => v > 0.01) && (
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="stats-swatch-est" /> Estimated across a sync gap
              </span>
            )}
          </span>
          <button type="button" className="stats-link" onClick={() => setTable((t) => !t)}>
            {table ? <ChartColumn className="size-3.5" /> : <Table2 className="size-3.5" />}
            {table ? 'Chart' : 'Table'}
          </button>
        </footer>
      </section>

      {/* ---------------------------------------------------- downloads */}
      <SectionTitle
        title="Downloads"
        note={
          data.trackingSince
            ? `Tracked hourly since ${new Date(data.trackingSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. ${fmt(lifetime.baseline)} downloads before that have no timestamps.`
            : 'Waiting for the first sync.'
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown
          tabs={[
            { id: 'platform', label: 'Platforms', rows: platformRows },
            { id: 'arch', label: 'Architectures', rows: archRows },
            { id: 'format', label: 'Formats', rows: formatRows },
          ]}
          metric="Downloads"
          empty="No downloads in this range"
          onPick={pick}
          picked={filters}
        />
        <Breakdown
          tabs={[{ id: 'kind', label: 'Type', rows: kindRows }]}
          metric="Count"
          empty="Nothing in this range"
          onPick={pick}
          picked={filters}
        />
        <Breakdown
          tabs={[{ id: 'tag', label: 'Versions', rows: tagRows }]}
          metric="Downloads"
          empty="No downloads in this range"
          onPick={pick}
          picked={filters}
        />
        <Breakdown
          tabs={[{ id: 'name', label: 'Files', rows: fileRows }]}
          metric="Downloads"
          empty="No downloads in this range"
          onPick={pick}
          picked={filters}
        />
      </div>

      <DownloadLog data={data} mask={mask} from={from} to={to} />

      {/* ---------------------------------------------------- traffic */}
      <SectionTitle
        title="Landing page"
        note={
          data.webConfigured
            ? `Copied from Vercel Web Analytics${data.runs.vercel ? `, last ${timeAgo(data.runs.vercel.at, now)}` : ''}${data.traffic.length ? `. Stored since ${new Date(data.traffic[0][0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}.`
            : null
        }
      />
      {!data.webConfigured && <WebSetup />}
      {data.runs.vercel && !data.runs.vercel.ok && (
        <p className="mb-4 rounded-[var(--radius-control)] border border-err/30 bg-err/10 px-3 py-2 text-[13px] text-err">
          Last Web Analytics copy failed: {data.runs.vercel.detail?.error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown tabs={[{ id: 'pages', label: 'Pages', rows: pageRows }]} metric="Visitors" empty={trafficEmpty} />
        <Breakdown
          tabs={[
            { id: 'ref', label: 'Referrers', rows: refRows },
            { id: 'utm', label: 'UTM sources', rows: utmRows },
          ]}
          metric="Visitors"
          empty={trafficEmpty}
        />
        <Breakdown tabs={[{ id: 'country', label: 'Countries', rows: countryRows }]} metric="Visitors" empty={trafficEmpty} />
        <Breakdown
          tabs={[
            { id: 'device', label: 'Devices', rows: deviceRows },
            { id: 'os', label: 'Operating systems', rows: osRows },
            { id: 'browser', label: 'Browsers', rows: browserRows },
          ]}
          metric="Visitors"
          empty={trafficEmpty}
        />
      </div>

      <footer className="mt-12 space-y-1.5 border-t border-line-subtle pt-6 text-[12px] leading-relaxed text-ink-4">
        <p>
          Times are shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}. Downloads count every release file, the same total GitHub
          reports. Use Type to narrow it to installers, auto-update payloads or update checks.
        </p>
        <p>
          Visitors are unique per hour as reported by Vercel, summed over the range, so a person who comes back later counts again.
          Download rate compares all GitHub downloads with landing-page visitors, so it includes people who download from GitHub
          directly.
        </p>
      </footer>
    </div>
  );
}

/* ======================================================================== */

function KpiTabs({ tiles, metric, onChange }) {
  const { container, bind, style } = useSlider(metric);
  return (
    <div ref={container} role="tablist" className="kpi-row">
      <span aria-hidden className="kpi-indicator" style={style} />
      {tiles.map((t) => (
        <button
          key={t.id}
          ref={bind(t.id)}
          type="button"
          role="tab"
          aria-selected={metric === t.id}
          className="kpi"
          onClick={() => onChange(t.id)}
        >
          <span className="kpi-label">{t.label}</span>
          <span className="flex items-baseline gap-2.5">
            <span className="kpi-value">{t.value}</span>
            {t.delta != null && Number.isFinite(t.delta) && (
              <span className={clsx('kpi-delta', t.delta >= 0 ? 'is-up' : 'is-down')}>
                {t.delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(t.delta * 100).toFixed(0)}%
              </span>
            )}
          </span>
          <span className="kpi-sub">{t.sub ?? ' '}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The headline number: every download GitHub has counted, before and after
 * tracking began. It follows the filters, but not the date range — a lifetime
 * total has no range.
 */
function Lifetime({ data, filters }) {
  const { total, baseline, platforms } = useMemo(() => {
    const mask = assetMask(data.assets, filters, 'platform');
    const exact = assetMask(data.assets, filters);
    let t = 0;
    let b = 0;
    data.assets.forEach((a, i) => {
      if (!exact[i]) return;
      t += a.total;
      b += a.baseline;
    });
    return { total: t, baseline: b, platforms: lifetimeBreakdown(data.assets, mask, 'platform') };
  }, [data.assets, filters]);

  const what = filters.kind ? KINDS[filters.kind].toLowerCase() : 'all files';
  const since = data.trackingSince
    ? new Date(data.trackingSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const max = Math.max(1, ...platforms.map((p) => p.value));

  return (
    <section className="lifetime">
      <div>
        <p className="eyebrow">All-time downloads · {what}</p>
        <p className="lifetime-value">{fmt(total)}</p>
        {since && (
          <p className="lifetime-sub">
            {fmt(baseline)} before tracking began · {fmt(total - baseline)} tracked since {since}
          </p>
        )}
      </div>
      <ul className="lifetime-split">
        {platforms.map((p) => (
          <li key={p.key} className={clsx(filters.platform && filters.platform !== p.key && 'is-muted')}>
            <span className="flex items-center gap-2">
              <PlatformIcon platform={p.key} />
              {PLATFORMS[p.key] ?? p.key}
            </span>
            <span className="lifetime-bar" aria-hidden>
              <span style={{ width: `${(p.value / max) * 100}%` }} />
            </span>
            <b>{fmt(p.value)}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionTitle({ title, note }) {
  return (
    <div className="mt-14 mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <h2 className="text-[20px] font-medium tracking-[-0.025em]">{title}</h2>
      {note && <p className="max-w-[640px] text-[12.5px] text-ink-4">{note}</p>}
    </div>
  );
}

function BucketTable({ edges, unit, series, metric, estimated }) {
  const rows = series
    .map((v, i) => ({ i, v }))
    .filter((r) => r.v > 0)
    .reverse();
  return (
    <div className="max-h-[300px] overflow-auto">
      <table className="w-full text-[13px]">
        <thead className="sticky top-0 bg-bg-elevated text-left">
          <tr className="eyebrow">
            <th className="px-3 py-2 font-normal">Period</th>
            <th className="px-3 py-2 text-right font-normal">{metric === 'rate' ? 'Rate' : 'Count'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="px-3 py-10 text-center text-ink-4">
                Nothing in this range
              </td>
            </tr>
          )}
          {rows.map(({ i, v }) => (
            <tr key={i} className="border-t border-line-subtle">
              <td className="px-3 py-2 text-ink-2">{fmtBucket(edges[i], edges[i + 1], unit)}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {metric === 'rate' ? fmtRate(v) : `${estimated?.[i] > 0.01 && metric === 'downloads' ? '~' : ''}${fmt(v)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- log */

const PAGE = 30;

/** The raw record: each time a counter moved, which file, and by how much. */
function DownloadLog({ data, mask, from, to }) {
  const [limit, setLimit] = useState(PAGE);
  const rows = useMemo(
    () =>
      data.events
        .filter(([a, , at]) => a != null && mask[a] && at > from && at <= to)
        .sort((x, y) => y[2] - x[2]),
    [data.events, mask, from, to],
  );
  useEffect(() => setLimit(PAGE), [from, to, mask]);

  const groups = [];
  for (const row of rows.slice(0, limit)) {
    const day = new Date(row[2]).toDateString();
    const last = groups[groups.length - 1];
    if (last?.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  }

  const time = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const date = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <section className="panel stats-card mt-4">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <h3 className="text-[14px] font-medium tracking-[-0.01em]">Download log</h3>
        <span className="eyebrow">{fmt(rows.length)} changes</span>
      </header>
      {rows.length === 0 ? (
        <p className="px-5 pb-8 pt-4 text-center text-[13px] text-ink-4">No downloads recorded in this range</p>
      ) : (
        <div className="pb-2">
          {groups.map((g) => (
            <div key={g.day}>
              <p className="eyebrow sticky top-0 border-y border-line-subtle bg-bg-elevated px-5 py-2">
                {new Date(g.rows[0][2]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <ul>
                {g.rows.map(([a, since, at, delta]) => {
                  const asset = data.assets[a];
                  const gap = at - since > 3 * 3_600_000;
                  return (
                    <li key={`${a}-${at}`} className="log-row">
                      <span className="log-time">
                        {gap ? `${date(since)} – ${date(at)}` : `${time(since)} – ${time(at)}`}
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <PlatformIcon platform={asset.platform} />
                        <span className="truncate font-[family-name:var(--font-geist-mono)] text-[12px] text-ink-2">
                          {asset.name}
                        </span>
                        {gap && <span className="stats-badge">sync gap</span>}
                      </span>
                      <span className="log-delta">+{fmt(delta)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {rows.length > limit && (
            <button type="button" className="stats-more" onClick={() => setLimit((l) => l + PAGE * 2)}>
              Show more
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function WebSetup() {
  return (
    <div className="panel stats-card mb-4 px-5 py-4 text-[13px] leading-relaxed text-ink-2">
      <p className="font-medium text-ink">Connect Vercel Web Analytics</p>
      <p className="mt-1">
        Create a token at vercel.com/account/settings/tokens scoped to your team, add it to the project as{' '}
        <code className="stats-code">VERCEL_ANALYTICS_TOKEN</code>, redeploy, then press Sync now. The first copy pulls the last 30 days;
        after that everything is kept here for good.
      </p>
    </div>
  );
}
