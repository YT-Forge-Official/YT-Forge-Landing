'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { YT_DLP_URL, DOWNLOADS_FALLBACK, formatApprox } from '@/lib/site';
import { Container } from './ui';
import { RotatingWord } from './RotatingWord';

/* The app is yt-dlp underneath, so the headline names sites it actually
   reaches rather than only the one it is best known for. Just the name moves;
   the sentence around it is fixed. The breadth claim — the part no list of
   five names can carry — is a hard figure in the spec bar instead, where the
   page already keeps its facts.

   Longest entry sets the headline's type size; see the note on .hero-title
   before adding one longer than "Instagram". */
const PLATFORMS = ['YouTube', 'Instagram', 'Twitter/X', 'TikTok', 'Facebook', 'Reddit'];

export function Hero({ downloads }) {
  // A live figure when GitHub answered, the pinned floor when it did not.
  // Either way it is rounded down, so the strip can never overstate.
  const total = formatApprox(downloads) ?? formatApprox(DOWNLOADS_FALLBACK);
  

  const sectionRef = useRef(null);
  const reduce = useReducedMotion();

  // The line masks clip the rise-in tightly, which would also shear the
  // platform word's blur. Once the intro has played, the first line's clip box
  // is let out — see `.masker-open`.
  const [maskOpen, setMaskOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMaskOpen(true), 1550);
    return () => clearTimeout(t);
  }, []);

  // Progress through THIS section, not absolute page pixels — an 800px window
  // means something different on a phone and on a 4K display.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 130]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const mark = section.querySelector('.hero-mark');
    const lens = section.querySelector('.hero-mark-lens');
    const edge = section.querySelector('.hero-mark-edge');
    const bar = section.querySelector('.hero-bar');
    if (!mark || !lens || !edge) return;

    let raf = 0;
    let pending = null;
    let lit = false;

    /*
      The light is geometry, not a recomputed mask.

      `lens` is a disc-sized box carrying a fixed, centred radial mask;
      `edge` is the outline at full mark size. Moving the lens to the cursor
      and sliding the outline back by the same offset shows exactly the disc
      the old moving-gradient mask drew — but the only property that changes
      is `transform`, on two layers the compositor already owns.

      What this replaces: a mask-position rewrite (which re-rasterises the
      masked layer) stacked on top of `filter: url(#edge-glow)` (which WebKit
      runs on the CPU), over a box up to 1400px square, sixty times a second.
    */
    const flush = () => {
      raf = 0;
      if (!pending) return;
      const r = mark.getBoundingClientRect();
      const radius = r.width * 0.28;
      const dx = pending.x - r.left - radius;
      const dy = pending.y - r.top - radius;
      lens.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      edge.style.transform = `translate3d(${-dx}px, ${-dy}px, 0)`;
      if (bar) bar.style.setProperty('--mx-bar', `${pending.x}px`);
    };

    // Coalesced into one write per frame: pointermove fires far more often
    // than the screen refreshes.
    const onMove = (e) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!lit) {
        // Place the disc before it starts fading up, so the first frame of the
        // transition is already in the right spot.
        flush();
        lit = true;
        section.dataset.lit = 'on';
        return;
      }
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onLeave = () => {
      lit = false;
      section.dataset.lit = 'off';
    };

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section id="top" ref={sectionRef} className="hero" data-lit="off">
      <div className="hero-stage">
        <Container className="relative z-10 text-center">
          {/* Stretch, not items-center: the lines are centred by the inherited
              text-align, and a shrink-to-fit line box would make "how much room
              is there" circular for the rotating slot, which measures against
              its nearest block ancestor. */}
          <h1 className="hero-title flex flex-col">
            <span className={maskOpen ? 'masker masker-open block' : 'masker block'}>
              <span className="hero-line block" style={{ '--d': '0ms' }}>
                <RotatingWord words={PLATFORMS} />{' '}
                <span className="relative mx-0.5 inline-block px-2">
                  <span>downloads</span>
                  <motion.span
                    className="bg-ink text-bg absolute inset-0 overflow-hidden rounded-[8px] whitespace-nowrap"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, delay: 0.9, ease: [0.76, 0, 0.24, 1] }}
                  >
                    <span className="block px-2">downloads</span>
                  </motion.span>
                </span>
              </span>
            </span>

            <span className="masker block">
              <span className="hero-line block" style={{ '--d': '150ms' }}>
                finally done right.
              </span>
            </span>
          </h1>
        </Container>

        <div className="hero-mark" aria-hidden>
          <motion.div style={{ y }} className="hero-mark-inner">
            {/* `unoptimized` on both: these are SVGs, so there is nothing for
                the image pipeline to do but add a round trip. `priority` so
                the largest thing in the first viewport is preloaded rather
                than lazily discovered. */}
            <Image
              src="/icon-black.svg"
              alt=""
              width={1200}
              height={1200}
              priority
              unoptimized
              className="hero-mark-base invert"
            />

            {/* The travelling disc, and the outline it reveals. icon-edge.svg
                is icon-black.svg's two paths stroked instead of filled — the
                same silhouette the erode-and-subtract filter used to derive at
                runtime, only now it is geometry the GPU can just draw. */}
            <div className="hero-mark-lens">
              <div className="hero-mark-edge">
                <Image src="/icon-edge.svg" alt="" width={1200} height={1200} unoptimized />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="hero-bar">
        {/* faint pool of light behind the lockup */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              'radial-gradient(46% 100% at 50% 0%, rgba(255,255,255,0.055), transparent 72%)',
          }}
        />

        <Container>
          <div className="hero-spec" data-reveal style={{ '--reveal-delay': '220ms' }}>
            <div className="hero-spec-cell">
              <span className="hero-spec-label">Powered by</span>
              <span className="hero-spec-value">
                <a
                  href={YT_DLP_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="yt-dlp on GitHub"
                  className="hero-spec-lockup"
                >
                  <Image src="/yt-dlp.png" alt="yt-dlp" width={500} height={500} />
                </a>
              </span>
            </div>

            <div className="hero-spec-cell">
              <span className="hero-spec-label">Sites Supported</span>
              <a 
                href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
                target="_blank"
                rel="noreferrer"
                className="hero-spec-value"
              >
                1,000+
              </a>
            </div>

            <div className="hero-spec-cell">
              <span className="hero-spec-label">Downloads</span>
              <span className="hero-spec-value">
                {/* <DownloadMarkIcon className="hero-spec-icon" /> */}
                {total}
              </span>
            </div>

            <div className="hero-spec-cell">
              <span className="hero-spec-label">Price</span>
              <span className="hero-spec-value">$FREE</span>
            </div>

            <div className="hero-spec-cell">
              <span className="hero-spec-label">Format Support</span>
              <span className="hero-spec-value">8K UHD</span>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
