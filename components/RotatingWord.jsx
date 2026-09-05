'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * A slot of type that swaps between interchangeable words or phrases.
 *
 * Three things make the swap read as one movement rather than a text change:
 *
 *  · Both phrases travel the same direction — the outgoing one keeps falling
 *    past the baseline while the incoming one arrives from above — so the eye
 *    follows a single downward drift instead of watching a crossfade.
 *  · Each phrase is hung from the slot's centre line and shrink-wrapped to its
 *    own measured width, so the two are concentric for the whole swap and
 *    neither enters or leaves towards a side.
 *  · The slot's own box eases to the incoming phrase's measured size, so
 *    everything around it travels on the same curve rather than snapping once
 *    the new phrase has landed.
 *
 * Sizes are measured, not guessed, from a hidden stack held to the same width
 * limit as the real line — so an entry too long for the screen is measured at
 * the size it will actually occupy, wrapped, rather than running off the side.
 * The slot then reserves the TALLEST of them and keeps it, and width is the
 * only thing that ever moves: a height that tracked the current entry would
 * grow and shrink everything below it once per loop. Each entry is centred in
 * the reserved box, so spare room reads as leading rather than as a gap.
 * Measurements are re-read once webfonts land and on resize, because both the
 * type and the limit are fluid.
 *
 * Entries may be a plain string or `{ text, hold }` — a payoff at the end of
 * the loop wants longer on screen than the phrases that set it up.
 *
 * The rotation is decoration; the accessible name is the full static list.
 */
export function RotatingWord({ words, hold = 2200, className }) {
  const items = words.map((w) => (typeof w === 'string' ? { text: w, hold } : { hold, ...w }));
  const [index, setIndex] = useState(0);
  const [sizes, setSizes] = useState(null);
  const slotRef = useRef(null);
  const measureRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const measure = () => {
      const slot = slotRef.current;
      const stack = measureRef.current;
      if (!slot || !stack) return;

      // The width the real line actually has to play with. The slot itself is
      // inline and sized by its content, so asking it is circular — walk out to
      // the first ancestor that isn't, which is the one imposing the limit.
      let block = slot.parentElement;
      while (block && getComputedStyle(block).display.startsWith('inline')) {
        block = block.parentElement;
      }
      const limit = block ? block.clientWidth : document.documentElement.clientWidth;

      stack.style.setProperty('--rotword-limit', `${limit}px`);
      setSizes(
        Array.from(stack.children).map((child) => {
          const r = child.getBoundingClientRect();
          return { w: r.width, h: r.height };
        }),
      );
    };

    measure();
    // Fluid type and a webfont: the first measurement is provisional on both.
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [words]);

  // Each phrase books its own next turn, so a per-phrase hold costs nothing —
  // there is no fixed-interval timer to fight. The first turn is booked late:
  // the headline's own rise owns the first second and a half.
  const holds = items.map((it) => it.hold).join(',');
  const startedRef = useRef(false);
  useEffect(() => {
    if (reduce) return;
    const wait = startedRef.current ? items[index].hold : 1600;
    const t = setTimeout(() => {
      startedRef.current = true;
      setIndex((n) => (n + 1) % items.length);
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, holds, reduce]);

  const size = sizes?.[index];
  // One height for every state — see the note above.
  const height = sizes ? Math.max(...sizes.map((m) => m.h)) : null;
  const text = items[index].text;

  return (
    <span
      ref={slotRef}
      className={['rotword', className].filter(Boolean).join(' ')}
      style={size ? { width: `${size.w}px`, height: `${height}px` } : undefined}
      data-measured={sizes ? 'on' : 'off'}
    >
      {/* Off-flow copies, one per phrase, each shrink-wrapped but held to the
          real line's width limit — so one that has to wrap is measured wrapped.
          Never painted, never read out. */}
      <span className="rotword-measure" ref={measureRef} aria-hidden>
        {items.map((it) => (
          <span key={it.text}>{it.text}</span>
        ))}
      </span>

      {/* Carries the slot's size until the measurements land — which is also
          what server-rendered and no-JS output falls back to. */}
      <span className="rotword-strut" aria-hidden>
        {text}
      </span>

      <span className="rotword-stack" aria-hidden>
        <AnimatePresence initial={false}>
          <motion.span
            key={text}
            className="rotword-item"
            // Frozen with the phrase: AnimatePresence keeps the outgoing node
            // as last rendered, so it leaves at its own width and cannot
            // re-wrap while the slot eases to the new one.
            style={size ? { width: `${size.w}px` } : undefined}
            // `x: -50%` is the centring, held constant across all three states
            // so it never interpolates — every frame of the swap is vertical.
            initial={reduce ? { opacity: 0, x: '-50%' } : { opacity: 0, x: '-50%', y: '-0.42em', filter: 'blur(6px)' }}
            animate={reduce ? { opacity: 1, x: '-50%' } : { opacity: 1, x: '-50%', y: '0em', filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0, x: '-50%' } : { opacity: 0, x: '-50%', y: '0.42em', filter: 'blur(6px)' }}
            transition={{ duration: reduce ? 0.3 : 0.62, ease: [0.33, 0, 0.2, 1] }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>

      <span className="sr-only">{items.map((it) => it.text).join(', ')}</span>
    </span>
  );
}
