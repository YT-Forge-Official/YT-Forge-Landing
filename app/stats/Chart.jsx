'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DAY, fmtCompact, fmtTick, niceScale } from './model';

const H = 300;

const unitLabel = (unit, count) => `downloads over ${count} ${unit}${count === 1 ? '' : 's'}`;
const PAD = { top: 16, right: 8, bottom: 30, left: 44 };

// Hover state chases its target instead of jumping to it — the same eased
// motion as the landing page's travelling highlight.
const RATE = 22;

/**
 * One series over time. Bars for counts, an area for rates and traffic.
 * Drag across the plot to zoom into that span; click a bucket to drill into it.
 */
export function Chart({
  edges,
  values,
  estimated,
  unit,
  mode = 'bar',
  formatValue,
  renderTip,
  onSelectRange,
  onDrill,
  canDrill,
  empty,
  integer = true,
  coverageFrom,
}) {
  const wrapRef = useRef(null);
  const bandRef = useRef(null);
  const tipRef = useRef(null);
  const dotRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);
  const [drag, setDrag] = useState(null);
  const motion = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, last: 0, shown: false });
  // The animation loop outlives the render that started it; it reads layout
  // from here so a resize mid-glide can't paint with stale numbers.
  const geom = useRef({ slot: 0, width: 0 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const n = values.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const slot = n ? plotW / n : 0;
  const max = Math.max(0, ...values);
  const hasGap = mode === 'bar' && Boolean(estimated?.some((e, i) => values[i] > 0.0001 && e > values[i] / 2));
  // Headroom for the gap label so it never sits on top of the bars it names.
  const { top, step } = niceScale(hasGap ? max * 1.25 : max, 4, integer);
  const y = (v) => PAD.top + plotH - (v / top) * plotH;
  const cx = (i) => PAD.left + slot * (i + 0.5);
  const barW = Math.max(1, Math.min(24, slot - 2));
  const spanDays = (edges[edges.length - 1] - edges[0]) / DAY;

  // Buckets before data collection began are unknown, not zero — shade them.
  let uncovered = 0;
  if (coverageFrom != null && n) {
    if (coverageFrom >= edges[n]) uncovered = n;
    else while (uncovered < n && edges[uncovered + 1] <= coverageFrom) uncovered++;
  }
  geom.current = { slot, width };

  const ticks = useMemo(() => {
    const out = [];
    for (let v = 0; v <= top + 1e-9; v += step) out.push(v);
    return out;
  }, [top, step]);

  const xLabels = useMemo(() => {
    if (!n || !plotW) return [];
    const room = Math.max(1, Math.floor(plotW / 76));
    const need = Math.ceil(n / room);
    const out = [];
    if (unit === 'hour') {
      const k = [1, 2, 3, 6, 12, 24, 48, 96].find((s) => s >= need) ?? need;
      for (let i = 0; i < n; i++) {
        const d = new Date(edges[i]);
        if (k <= 24 ? d.getHours() % k === 0 : d.getHours() === 0 && Math.round((edges[i] - edges[0]) / DAY) % (k / 24) === 0) out.push(i);
      }
    } else {
      for (let i = 0; i < n; i += need) out.push(i);
    }
    return out;
  }, [n, plotW, unit, edges]);

  /* ---------------------------------------------------------- motion */

  const place = (i) => {
    const m = motion.current;
    m.tx = cx(i);
    m.ty = mode === 'area' ? y(values[i]) : PAD.top;
    if (!m.shown) {
      // Invisible until now, so re-aiming outright can't be seen as a jump.
      m.x = m.tx;
      m.y = m.ty;
      m.shown = true;
    }
    if (!m.raf) {
      m.last = performance.now();
      m.raf = requestAnimationFrame(tick);
    }
  };

  const tick = (now) => {
    const m = motion.current;
    const dt = Math.min(0.05, (now - m.last) / 1000);
    m.last = now;
    const k = 1 - Math.exp(-RATE * dt);
    m.x += (m.tx - m.x) * k;
    m.y += (m.ty - m.y) * k;
    paint();
    if (Math.abs(m.tx - m.x) > 0.2 || Math.abs(m.ty - m.y) > 0.2) m.raf = requestAnimationFrame(tick);
    else {
      m.x = m.tx;
      m.y = m.ty;
      paint();
      m.raf = 0;
    }
  };

  const paint = () => {
    const m = motion.current;
    const { slot, width } = geom.current;
    if (bandRef.current) bandRef.current.setAttribute('transform', `translate(${m.x - Math.max(slot, 6) / 2} 0)`);
    if (dotRef.current) dotRef.current.setAttribute('transform', `translate(${m.x} ${m.y})`);
    const tip = tipRef.current;
    if (tip) {
      const w = tip.offsetWidth;
      const left = m.x + 14 + w > width ? m.x - 14 - w : m.x + 14;
      tip.style.transform = `translate(${Math.max(0, left)}px, ${PAD.top}px)`;
    }
  };

  useEffect(() => () => cancelAnimationFrame(motion.current.raf), []);
  useEffect(() => {
    if (hover == null) motion.current.shown = false;
    else place(hover);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, width, values]);

  /* ---------------------------------------------------------- pointer */

  const indexAt = (clientX) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const i = Math.floor((clientX - rect.left - PAD.left) / slot);
    return Math.max(0, Math.min(n - 1, i));
  };

  const onPointerDown = (e) => {
    if (!n || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const i = indexAt(e.clientX);
    setDrag({ a: i, b: i });
  };
  const onPointerMove = (e) => {
    if (!n) return;
    const i = indexAt(e.clientX);
    setHover(i);
    if (drag) setDrag((d) => (d && d.b !== i ? { ...d, b: i } : d));
  };
  const onPointerUp = (e) => {
    if (!drag) return;
    const i = indexAt(e.clientX);
    const lo = Math.min(drag.a, i);
    const hi = Math.max(drag.a, i);
    setDrag(null);
    if (hi > lo) onSelectRange?.(edges[lo], edges[hi + 1]);
    else if (canDrill) onDrill?.(edges[lo], edges[lo + 1]);
  };
  const onKeyDown = (e) => {
    if (!n) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      setHover((h) => Math.max(0, Math.min(n - 1, (h ?? (d > 0 ? -1 : n)) + d)));
    } else if (e.key === 'Enter' && hover != null && canDrill) {
      onDrill?.(edges[hover], edges[hover + 1]);
    } else if (e.key === 'Escape') {
      setHover(null);
    }
  };

  /* ---------------------------------------------------------- marks */

  const bars =
    mode === 'bar' &&
    values.map((v, i) => {
      if (!(v > 0.0001)) return null;
      const h = Math.max(1.5, plotH - (y(v) - PAD.top));
      const x = cx(i) - barW / 2;
      const top0 = PAD.top + plotH - h;
      const r = Math.min(4, barW / 2, h);
      const d = `M${x},${top0 + h}V${top0 + r}A${r},${r} 0 0 1 ${x + r},${top0}H${x + barW - r}A${r},${r} 0 0 1 ${x + barW},${top0 + r}V${top0 + h}Z`;
      const est = estimated?.[i] > v / 2;
      return (
        <path
          key={i}
          d={d}
          className={`chart-bar${est ? ' is-est' : ''}${hover === i ? ' is-hover' : ''}`}
        />
      );
    });

  // A stretch of buckets filled by spreading one lump evenly reads as a flat
  // plateau, which looks like real data. Name it on the chart itself.
  const gaps = [];
  if (mode === 'bar' && estimated) {
    let start = -1;
    for (let i = 0; i <= n; i++) {
      const est = i < n && values[i] > 0.0001 && estimated[i] > values[i] / 2;
      if (est && start < 0) start = i;
      if (!est && start >= 0) {
        if (i - start >= 2) {
          let sum = 0;
          let peak = 0;
          for (let j = start; j < i; j++) {
            sum += values[j];
            peak = Math.max(peak, values[j]);
          }
          gaps.push({ x: PAD.left + slot * start, w: slot * (i - start), y: y(peak), sum, count: i - start });
        }
        start = -1;
      }
    }
  }

  const linePath =
    mode === 'area' && n
      ? values.map((v, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
      : '';
  const areaPath = linePath ? `${linePath}L${cx(n - 1)},${PAD.top + plotH}L${cx(0)},${PAD.top + plotH}Z` : '';

  const sel = drag && drag.a !== drag.b && {
    x: PAD.left + slot * Math.min(drag.a, drag.b),
    w: slot * (Math.abs(drag.a - drag.b) + 1),
  };

  return (
    <div
      ref={wrapRef}
      className="chart"
      style={{ height: H }}
      tabIndex={0}
      role="application"
      aria-label="Chart. Use left and right arrows to read values, Enter to zoom into a bucket."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => !drag && setHover(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setHover(null)}
      data-drill={canDrill ? 'on' : 'off'}
    >
      {width > 0 && (
        <svg width={width} height={H} className="block select-none">
          <defs>
            <pattern id="chart-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="5" style={{ fill: 'var(--chart-est-bg)' }} />
              <line x1="0" y1="0" x2="0" y2="5" strokeWidth="2" style={{ stroke: 'var(--chart-est-line)' }} />
            </pattern>
            <pattern id="chart-uncovered" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.045)" strokeWidth="3" />
            </pattern>
            <linearGradient id="chart-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--chart-mark)', stopOpacity: 0.16 }} />
              <stop offset="1" style={{ stopColor: 'var(--chart-mark)', stopOpacity: 0.01 }} />
            </linearGradient>
          </defs>

          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="chart-grid" />
              <text x={PAD.left - 10} y={y(v)} dy="0.32em" textAnchor="end" className="chart-axis">
                {formatValue ? formatValue(v, true) : fmtCompact(v)}
              </text>
            </g>
          ))}

          {xLabels.map((i) => (
            <text key={i} x={cx(i)} y={H - 8} textAnchor="middle" className="chart-axis">
              {fmtTick(edges[i], unit, spanDays)}
            </text>
          ))}

          {uncovered > 0 && (
            <g className="chart-uncovered">
              <rect x={PAD.left} y={PAD.top} width={slot * uncovered} height={plotH} fill="url(#chart-uncovered)" />
              {slot * uncovered > 90 && !empty && (
                <text x={PAD.left + (slot * uncovered) / 2} y={PAD.top + plotH / 2} textAnchor="middle" dy="0.32em">
                  Not tracked yet
                </text>
              )}
            </g>
          )}

          <rect
            ref={bandRef}
            x={0}
            y={PAD.top}
            width={Math.max(slot, 6)}
            height={plotH}
            rx={4}
            className="chart-band"
            style={{ opacity: hover == null ? 0 : 1 }}
          />

          {bars}
          {areaPath && (
            <>
              <path d={areaPath} fill="url(#chart-area)" />
              <path d={linePath} className="chart-line" />
            </>
          )}
          {mode === 'area' && (
            <circle ref={dotRef} r={4} className="chart-dot" style={{ opacity: hover == null ? 0 : 1 }} />
          )}

          {gaps.map((g) =>
            g.w < 150 ? null : (
              <g key={g.x} className="chart-gap">
                <path d={`M${g.x + 4},${g.y - 6}v-4H${g.x + g.w - 4}v4`} />
                <text x={g.x + g.w / 2} y={g.y - 16} textAnchor="middle">
                  ~{Math.round(g.sum)} {unitLabel(unit, g.count)} between syncs · spread evenly, exact {unit === 'hour' ? 'hours' : 'days'} unknown
                </text>
              </g>
            ),
          )}

          {sel && <rect x={sel.x} y={PAD.top} width={sel.w} height={plotH} rx={4} className="chart-selection" />}
        </svg>
      )}

      {empty && <div className="chart-empty">{empty}</div>}

      <div ref={tipRef} className="chart-tip" style={{ opacity: hover != null && !sel ? 1 : 0 }}>
        {hover != null && renderTip?.(hover)}
      </div>
    </div>
  );
}
