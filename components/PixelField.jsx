'use client';

import { useEffect, useRef } from 'react';

/**
 * A field of shimmering pixels, masked to a silhouette (the YT-FORGE mark).
 *
 * Unlike the usual hover-triggered pixel card, this field is ALWAYS alive —
 * just very dim. Proximity of the pointer (not hover) lifts the dimness in a
 * radius around the cursor, falling off radially, so the mark reads as lit
 * from wherever the cursor happens to be. The pointer is tracked on
 * `pointerTargetRef` (the whole hero section) so the field reacts the moment
 * the section's edges start reacting, well before the cursor is over the mark.
 */
export function PixelField({
  maskSrc,
  pointerTargetRef,
  gap = 9,
  radius = 420,
  baseAlpha = 0.1,
  peakAlpha = 0.3,
  speed = 0.0022,
  className = '',
  style,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let pixels = [];
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Pointer state, in canvas-local CSS px. `cur` chases `target` so the
    // light drags a little behind the cursor instead of snapping.
    const target = { x: -9999, y: -9999 };
    const cur = { x: -9999, y: -9999 };
    let seen = false;

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      if (!width || !height) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      pixels = [];
      for (let x = 0; x < width; x += gap) {
        for (let y = 0; y < height; y += gap) {
          pixels.push({
            x,
            y,
            // per-pixel shimmer so the field never pulses in lockstep
            phase: Math.random() * Math.PI * 2,
            rate: 0.5 + Math.random() * 0.7,
            // some pixels are simply brighter/bigger than their neighbours
            weight: 0.35 + Math.random() * 0.65,
            max: 1.4 + Math.random() * 1.4,
          });
        }
      }
    };

    const draw = (t) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // ease the light toward the cursor
      if (seen) {
        cur.x += (target.x - cur.x) * 0.12;
        cur.y += (target.y - cur.y) * 0.12;
      }

      const r2 = radius * radius;
      const lift = peakAlpha - baseAlpha;

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];

        // radial proximity falloff, squared for a softer core-to-edge ramp
        let near = 0;
        if (seen) {
          const dx = p.x - cur.x;
          const dy = p.y - cur.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            const f = 1 - Math.sqrt(d2) / radius;
            near = f * f;
          }
        }

        // shimmer: always breathing, subtle when dim, livelier when lit
        const shimmer = reduced
          ? 0.8
          : 0.72 + 0.28 * Math.sin(t * speed * p.rate + p.phase);

        const alpha = (baseAlpha + lift * near * p.weight) * shimmer;
        if (alpha < 0.012) continue;

        // lit pixels also grow, so the glow has body and not just brightness
        const size = p.max * (0.55 + 0.45 * near) * (0.7 + 0.3 * shimmer);
        const off = (gap - size) * 0.5;

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(p.x + off, p.y + off, size, size);
      }
    };

    let raf = null;
    let prev = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - prev < 1000 / 60) return;
      prev = now;
      draw(now);
    };

    const start = () => {
      if (raf === null) {
        prev = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!seen) {
        // first sighting: light up in place rather than sliding in from -9999
        cur.x = x;
        cur.y = y;
        seen = true;
      }
      target.x = x;
      target.y = y;
    };
    const onLeave = () => {
      seen = false;
      cur.x = -9999;
      cur.y = -9999;
      target.x = -9999;
      target.y = -9999;
    };

    build();
    draw(0);

    const pointerTarget = pointerTargetRef?.current ?? wrap;
    const hoverless = window.matchMedia('(hover: none)').matches;
    if (!hoverless) {
      pointerTarget.addEventListener('pointermove', onMove, { passive: true });
      pointerTarget.addEventListener('pointerleave', onLeave);
    }

    const ro = new ResizeObserver(() => {
      build();
      draw(performance.now());
    });
    ro.observe(wrap);

    // don't burn frames on a field nobody can see
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '10%' }
    );
    io.observe(wrap);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      if (!hoverless) {
        pointerTarget.removeEventListener('pointermove', onMove);
        pointerTarget.removeEventListener('pointerleave', onLeave);
      }
    };
  }, [gap, radius, baseAlpha, peakAlpha, speed, pointerTargetRef]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        maskImage: `url(${maskSrc})`,
        WebkitMaskImage: `url(${maskSrc})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        ...style,
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
