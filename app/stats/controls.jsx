'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { clsx } from '@/lib/clsx';
import { PRESETS, fmt } from './model';

/**
 * One indicator for the whole group, gliding to whichever item is active —
 * never a highlight per item. Returns a ref map for the items and the
 * indicator's style.
 */
export function useSlider(active, deps = []) {
  const container = useRef(null);
  const items = useRef(new Map());
  const [box, setBox] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = items.current.get(active);
      const root = container.current;
      if (!el || !root) return setBox(null);
      const a = el.getBoundingClientRect();
      const b = root.getBoundingClientRect();
      setBox((prev) => {
        const next = { x: a.left - b.left + root.scrollLeft, y: a.top - b.top, w: a.width, h: a.height };
        return prev && prev.x === next.x && prev.w === next.w && prev.y === next.y && prev.h === next.h ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (container.current) ro.observe(container.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);

  const style = box
    ? { width: box.w, height: box.h, transform: `translate(${box.x}px, ${box.y}px)`, opacity: 1 }
    : { opacity: 0 };
  const bind = (key) => (el) => {
    if (el) items.current.set(key, el);
    else items.current.delete(key);
  };
  return { container, bind, style, ready: Boolean(box) };
}

/** Text tabs over a single gliding underline. */
export function Tabs({ items, value, onChange, size = 'sm' }) {
  const { container, bind, style } = useSlider(value, [items.length]);
  return (
    <div ref={container} role="tablist" className={clsx('tabs', size === 'md' && 'tabs-md')}>
      <span aria-hidden className="tabs-indicator" style={style} />
      {items.map((item) => (
        <button
          key={item.id}
          ref={bind(item.id)}
          role="tab"
          type="button"
          aria-selected={item.id === value}
          disabled={item.disabled}
          className="tabs-item"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Segmented control: same gliding idea, a filled pill instead of a line. */
export function Segmented({ items, value, onChange, label }) {
  const { container, bind, style } = useSlider(value, [items.map((i) => i.id).join()]);
  return (
    <div ref={container} role="radiogroup" aria-label={label} className="segmented">
      <span aria-hidden className="segmented-indicator" style={style} />
      {items.map((item) => (
        <button
          key={item.id}
          ref={bind(item.id)}
          type="button"
          role="radio"
          aria-checked={item.id === value}
          disabled={item.disabled}
          className="segmented-item"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- breakdown */

const VISIBLE = 8;

/**
 * A Vercel-style ranked list: label left, number right, a proportional wash
 * behind the row. Several tabs can share one card (Devices / OS / Browsers).
 */
export function Breakdown({ tabs, metric, empty, onPick, picked }) {
  const [tab, setTab] = useState(tabs[0].id);
  const [expanded, setExpanded] = useState(false);
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  const rows = current.rows;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const shown = expanded ? rows : rows.slice(0, VISIBLE);
  const pickable = Boolean(onPick && current.pickable !== false);

  useEffect(() => setExpanded(false), [tab]);

  return (
    <section className="panel stats-card flex flex-col">
      <header className="flex items-center justify-between gap-4 px-5 pt-4">
        {tabs.length > 1 ? (
          <Tabs items={tabs.map(({ id, label }) => ({ id, label }))} value={current.id} onChange={setTab} />
        ) : (
          <h3 className="text-[14px] font-medium tracking-[-0.01em]">{current.label}</h3>
        )}
        <span className="eyebrow shrink-0">{current.metric ?? metric}</span>
      </header>

      <ul className={clsx('stats-rows mt-3 px-2 pb-2', expanded && 'is-expanded')}>
        {shown.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-ink-4">{empty}</li>}
        {shown.map((row) => {
          const isPicked = picked?.[current.id] === row.key;
          const Tag = pickable ? 'button' : 'div';
          return (
            <li key={String(row.key)}>
              <Tag
                type={pickable ? 'button' : undefined}
                className={clsx('stats-row', pickable && 'is-pickable', isPicked && 'is-picked')}
                onClick={pickable ? () => onPick(current.id, isPicked ? null : row.key) : undefined}
                aria-pressed={pickable ? isPicked : undefined}
                title={pickable ? (isPicked ? 'Remove filter' : `Filter by ${row.label}`) : row.title}
              >
                <span aria-hidden className="stats-row-fill" style={{ width: `${(row.value / max) * 100}%` }} />
                <span className="relative flex min-w-0 items-center gap-2.5">
                  {row.icon}
                  <span className={clsx('truncate', row.mono && 'font-[family-name:var(--font-geist-mono)] text-[12px]')}>
                    {row.label}
                  </span>
                  {row.badge && <span className="stats-badge">{row.badge}</span>}
                  {isPicked && <Check className="size-3.5 shrink-0 text-ink" strokeWidth={2.5} />}
                </span>
                <span className="relative tabular-nums text-ink-2">{row.approx ? '~' : ''}{fmt(row.value)}</span>
              </Tag>
            </li>
          );
        })}
      </ul>

      {rows.length > VISIBLE && (
        <button type="button" className="stats-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `View all ${rows.length}`}
        </button>
      )}
    </section>
  );
}

/* -------------------------------------------------------------- range menu */

const toInput = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fromInput = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

export function RangeMenu({ preset, label, range, onPreset, onCustom }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: '', to: '' });
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDraft({ from: toInput(range.from), to: toInput(range.to - 1) });
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const apply = (e) => {
    e.preventDefault();
    if (!draft.from || !draft.to) return;
    const a = fromInput(draft.from);
    const b = fromInput(draft.to);
    const lo = Math.min(a, b);
    const hi = new Date(Math.max(a, b));
    hi.setDate(hi.getDate() + 1);
    onCustom(lo, hi.getTime());
    setOpen(false);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="stats-control"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Calendar className="size-4 text-ink-3" />
        <span>{label}</span>
        <ChevronDown className={clsx('size-4 text-ink-3 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <div className={clsx('stats-menu', open && 'is-open')} role="menu">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="menuitemradio"
            aria-checked={preset === p.id}
            className="stats-menu-item"
            onClick={() => {
              onPreset(p.id);
              setOpen(false);
            }}
          >
            <span>{p.label}</span>
            {preset === p.id && <Check className="size-4" strokeWidth={2.5} />}
          </button>
        ))}
        <form onSubmit={apply} className="mt-1 border-t border-line-subtle px-2 pt-3 pb-1">
          <p className="eyebrow mb-2 px-1">Custom range</p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="stats-date"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
              aria-label="From"
            />
            <span className="text-ink-4">–</span>
            <input
              type="date"
              className="stats-date"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              aria-label="To"
            />
          </div>
          <button type="submit" className="stats-apply mt-2 w-full">
            Apply
          </button>
        </form>
      </div>
    </div>
  );
}
