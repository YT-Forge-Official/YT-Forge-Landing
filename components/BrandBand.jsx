'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { EDITORS } from '@/lib/site';
import { Container } from './ui';

/**
 * "Drops straight into" — a drag-and-drop demonstration.
 *
 * One rAF loop drives two things, so they can never fight each other:
 *
 *  1. The marquee. Two identical halves translated by a float that wraps at
 *     the measured half-width — a pixel-exact repeat, no seam. It glides to a
 *     near-stop while the cursor is in the section and back up on the way out.
 *
 *  2. The cursor. It carries a video file and does nothing else — no magnet,
 *     no lock, no snap. The file trails on its own spring and swings from the
 *     point it is held, and that is the entire motion budget.
 *
 * The loop also reports which editor is nearest, but only as a class toggle:
 * that editor's plate fades up and the rest of the row falls back, both in
 * CSS. Nothing is ever repositioned to meet the cursor, so there is no
 * travelling object competing with the pointer for your attention.
 */

const SPEED = 58; // px/s at full tilt
const HYSTERESIS = 34; // px a rival must win by before it takes the highlight

/** Frame-rate independent smoothing. */
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
/** Approaches ±max asymptotically — a clamp that never visibly hits its wall. */
const soften = (v, max) => max * Math.tanh(v / max);
/** Ease with zero velocity at both ends — nothing kicks on arrival. */
const smooth = (t) => t * t * (3 - 2 * t);

export function BrandBand() {
  // Repeats per half. Measured, not guessed: a half must out-span the viewport
  // or the loop shows its seam.
  const [reps, setReps] = useState(2);

  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const ghostRef = useRef(null);
  const innerRef = useRef(null);
  const chipRef = useRef(null);
  const itemsRef = useRef([]);

  const half = [];
  for (let r = 0; r < reps; r++) half.push(...EDITORS);
  const rendered = half.concat(half);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const ghost = ghostRef.current;
    const inner = innerRef.current;
    const chip = chipRef.current;
    if (!section || !viewport || !track) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const draggable = fine && !reduce && ghost && inner && chip;

    // ——— geometry ———
    let items = []; // { node, name, left, w } — left is relative to the track
    let halfW = 0;
    let view = { left: 0, right: 0, top: 0, bottom: 0, width: 0 };
    let rectsDirty = true;

    const readView = () => {
      const r = viewport.getBoundingClientRect();
      view = { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
    };

    /** Returns false when the repeat count was wrong and the effect will re-run. */
    const measure = () => {
      const nodes = itemsRef.current.filter(Boolean);
      if (nodes.length < 2) return false;

      const origin = track.getBoundingClientRect().left;
      items = nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { node, left: r.left - origin, w: r.width };
      });

      // The second half begins exactly one half-width in — an exact float,
      // unlike scrollWidth, which rounds.
      halfW = items[nodes.length / 2].left - items[0].left;
      readView();
      rectsDirty = false;

      if (halfW <= 0) return false;

      const setW = halfW / reps;
      const want = Math.min(8, Math.max(2, Math.ceil((view.width + 400) / setW)));
      if (want !== reps) {
        setReps(want);
        return false;
      }
      return true;
    };

    if (!measure()) return;

    // ——— state ———
    let raf = 0;
    let last = performance.now();
    let running = false;

    let offset = 0; // px the track is shifted left, kept within [0, halfW)
    let mul = reduce ? 0 : 1;
    let mulTarget = mul;

    let px = 0; // pointer, client coords
    let py = 0;
    let cx = 0; // the cursor — the pointer, smoothed
    let cy = 0;
    let fx = 0; // the file, trailing the cursor on its own spring
    let tilt = 0;
    let vis = 0;
    let visTarget = 0;

    let active = null; // the nearest editor, or null
    let lockedNode = null;

    const setActive = (item) => {
      const node = item ? item.node : null;
      if (lockedNode === node) return;
      if (lockedNode) lockedNode.dataset.drop = 'off';
      if (node) node.dataset.drop = 'on';
      section.dataset.target = node ? 'on' : 'off';
      lockedNode = node;
    };

    const render = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // While the cursor is in play the strip's rect must be exact — a scroll,
      // a resize or the reveal transition settling all move it. One read per
      // frame is cheap next to being wrong; idle, nothing is read at all.
      if (rectsDirty || visTarget > 0 || vis > 0.001) {
        readView();
        rectsDirty = false;
      }

      // ——— marquee ———
      mul += (mulTarget - mul) * damp(3.4, dt);
      offset += SPEED * mul * dt;
      if (offset >= halfW) offset -= halfW * Math.floor(offset / halfW);
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;

      if (!draggable) {
        raf = requestAnimationFrame(render);
        return;
      }

      // ——— which editor is under the file ———
      // Recomputed every frame rather than left to :hover, because the row
      // slides beneath a cursor that may not be moving. Hysteresis keeps two
      // neighbours from trading the highlight at their shared midpoint.
      const origin = view.left - offset;
      let best = null;
      let bestD = Infinity;
      if (visTarget > 0) {
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const mid = origin + it.left + it.w / 2;
          if (mid < view.left - it.w || mid > view.right + it.w) continue;
          const d = Math.abs(px - mid);
          if (d < bestD) {
            bestD = d;
            best = it;
          }
        }
        if (active && best && best !== active) {
          const dCur = Math.abs(px - (origin + active.left + active.w / 2));
          if (dCur - bestD < HYSTERESIS) {
            best = active;
            bestD = dCur;
          }
        }
      }

      const inBand = py > view.top - 44 && py < view.bottom + 44;
      active = best && inBand && bestD < best.w * 0.55 && visTarget > 0 ? best : null;
      setActive(active);

      // ——— the cursor ———
      // Follows the pointer and nothing else. There is no target term here.
      vis += (visTarget - vis) * damp(9, dt);
      cx += (px - cx) * damp(19, dt);
      cy += (py - cy) * damp(19, dt);

      // The file trails, and the lateral lag swings it from the point of hold.
      // Both the offset and the tilt are softened rather than clamped, and the
      // tilt is smoothed again on top, so a fast sweep can't snap either one.
      fx += (cx - fx) * damp(14, dt);
      const lag = soften(fx - cx, 16);
      tilt += (lag * -0.22 - tilt) * damp(16, dt);

      ghost.style.opacity = vis.toFixed(3);
      ghost.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      inner.style.transform = `scale(${(0.78 + 0.22 * smooth(vis)).toFixed(3)})`;
      chip.style.transform = `translate3d(${lag.toFixed(2)}px, 0, 0) rotate(${tilt.toFixed(2)}deg)`;

      raf = requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      // The ghost is position:fixed — parking the loop must not strand it on
      // screen over whatever scrolled in behind.
      visTarget = 0;
      vis = 0;
      active = null;
      setActive(null);
      section.dataset.armed = 'off';
      section.dataset.target = 'off';
      if (draggable) ghost.style.opacity = '0';
    };

    // ——— listeners ———
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      if (visTarget === 0) {
        // Arrive at the cursor rather than from wherever the page was last
        // touched — unless a previous exit is still fading, where holding the
        // position is the smoother read.
        if (vis < 0.15) {
          cx = px;
          cy = py;
          fx = px;
          tilt = 0;
        }
        visTarget = 1;
        mulTarget = reduce ? 0 : 0.14;
        section.dataset.armed = 'on';
      }
    };
    const onLeave = () => {
      visTarget = 0;
      mulTarget = reduce ? 0 : 1;
      section.dataset.armed = 'off';
    };
    const onScroll = () => {
      rectsDirty = true;
    };

    if (draggable) {
      section.addEventListener('pointermove', onMove, { passive: true });
      section.addEventListener('pointerleave', onLeave);
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    const ro = new ResizeObserver(() => {
      rectsDirty = true;
      measure();
    });
    ro.observe(viewport);

    // Only burn frames while the strip is on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '120px 0px' },
    );
    io.observe(section);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      if (draggable) {
        section.removeEventListener('pointermove', onMove);
        section.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('scroll', onScroll);
      }
    };
  }, [reps]);

  return (
    <section
      ref={sectionRef}
      className="dropzone relative overflow-hidden py-16 sm:py-20"
      data-armed="off"
      data-target="off"
    >
      <Container>
        <div className="rule" />
        <h2 className="dropzone-title mt-9 text-center sm:mt-11" data-reveal>
          Drops straight <em>into</em>
        </h2>
      </Container>

      <div
        ref={viewportRef}
        className="marquee-viewport mt-8 sm:mt-10"
        data-reveal
        style={{ '--reveal-delay': '140ms' }}
      >
        <div ref={trackRef} className="marquee-track">
          {rendered.map((editor, i) => (
            <div
              key={i}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              className="drop-item"
              data-drop="off"
              // The row is duplicated for the loop; only announce it once.
              aria-hidden={i >= EDITORS.length ? 'true' : undefined}
            >
              <span className="drop-plate" aria-hidden />
              <Image
                src={editor.icon}
                alt=""
                width={128}
                height={128}
                sizes="72px"
                className="drop-item-logo"
              />
              <span className="drop-item-name">{editor.name}</span>
            </div>
          ))}
        </div>
      </div>

      <Container>
        <div className="rule mt-9 sm:mt-11" />
      </Container>

      {/* the cursor carrying a video file — mouse only, above everything */}
      <div ref={ghostRef} className="drag-ghost" aria-hidden>
        <div ref={innerRef} className="drag-ghost-inner">
          <div ref={chipRef} className="drag-file">
            <span className="drag-file-thumb">
              <svg viewBox="0 0 24 24" fill="none" className="size-3">
                <path d="M9.5 7.6v8.8L17 12 9.5 7.6Z" fill="currentColor" />
              </svg>
            </span>
            <span className="drag-file-text">
              <span className="drag-file-name">clip_2160p.mp4</span>
              <span className="drag-file-meta">H.264 · AAC</span>
            </span>
          </div>

          {/* the pointer itself — white, with a dark keyline so it holds
              against both the logos and the ground */}
          <svg viewBox="0 0 24 24" className="drag-cursor">
            <path
              d="M5 2.4 5 19.9 9.7 15.6 12.4 21.7 15.1 20.4 12.5 14.6 18.7 14.6Z"
              fill="#fff"
              stroke="rgba(0,0,0,0.55)"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
