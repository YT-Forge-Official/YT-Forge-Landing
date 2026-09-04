'use client';

import { useEffect } from 'react';

/**
 * One IntersectionObserver for every [data-reveal] on the page.
 * Elements fade + rise once, then stop being watched.
 */
export function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]:not(.is-in)');
    if (!nodes.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

/**
 * The footer reveal only works while the footer is SHORTER than the viewport.
 * It is sticky at bottom:0 beneath an opaque page sheet, so at maximum scroll
 * it sits flush with the viewport bottom — anything taller than the screen has
 * its top above the fold with the sheet still covering it, which makes those
 * pixels unreachable at every scroll position.
 *
 * A media query cannot express that, because it depends on the footer's own
 * rendered height. So it is measured, and the effect is opt-in: the default
 * (and the server-rendered state) is an ordinary footer, which is always safe.
 */
export function useFooterReveal() {
  useEffect(() => {
    const footer = document.querySelector('.footer-reveal');
    if (!footer) return;

    const root = document.documentElement;
    let frame = 0;

    const sync = () => {
      frame = 0;
      // 2px of tolerance for sub-pixel layout rounding.
      const fits = footer.offsetHeight <= window.innerHeight - 2;
      const next = fits ? 'on' : 'off';
      if (root.dataset.footerReveal !== next) root.dataset.footerReveal = next;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    sync();

    // The footer's height changes with its own reflow (wrapping, font load),
    // not just with the window.
    const ro = new ResizeObserver(schedule);
    ro.observe(footer);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      delete root.dataset.footerReveal;
    };
  }, []);
}
