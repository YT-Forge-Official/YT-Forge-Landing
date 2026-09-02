'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { YT_DLP_URL, DOWNLOADS_FALLBACK, formatApprox } from '@/lib/site';
import { Container } from './ui';
import { DownloadMarkIcon } from './icons';
import { PixelField } from './PixelField';

/**
 * The hero is three stacked bands — nav clearance, stage, bar — and one size
 * token, `--mark`, that every gap is expressed against. Nothing here measures
 * the viewport directly, so the composition holds its proportions instead of
 * re-shuffling at each breakpoint.
 *
 * Two things are deliberately kept off the layout:
 *  · the parallax rides its own layer inside the mark, so it cannot fight the
 *    transform that positions the mark;
 *  · the pointer light is written as CSS variables, so it never triggers a
 *    React render or a reflow.
 */
export function Hero({ downloads }) {
  // A live figure when GitHub answered, the pinned floor when it did not.
  // Either way it is rounded down, so the strip can never overstate.
  const total = formatApprox(downloads) ?? formatApprox(DOWNLOADS_FALLBACK);
  

  const sectionRef = useRef(null);
  const reduce = useReducedMotion();

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
    let raf = 0;
    let pending = null;

    // Coalesced into one write per frame: pointermove fires far more often
    // than the screen refreshes.
    const flush = () => {
      raf = 0;
      if (!pending || !mark) return;
      const r = mark.getBoundingClientRect();
      mark.style.setProperty('--mx', `${pending.x - r.left}px`);
      mark.style.setProperty('--my', `${pending.y - r.top}px`);
      section.style.setProperty('--mx-bar', `${pending.x}px`);
      section.style.setProperty('--hover', '1');
    };

    const onMove = (e) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onLeave = () => section.style.setProperty('--hover', '0');

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section id="top" ref={sectionRef} className="hero">
      {/* Edge extraction for the cursor-lit outline of the mark. */}
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
        <defs>
          <filter id="edge-glow">
            <feMorphology operator="erode" radius="1" in="SourceAlpha" result="eroded" />
            <feComposite in="SourceAlpha" in2="eroded" operator="out" result="edges" />
            <feGaussianBlur in="edges" stdDeviation="0.3" result="soft" />
            <feFlood floodColor="white" floodOpacity="1" result="white" />
            <feComposite in="white" in2="soft" operator="in" />
          </filter>
        </defs>
      </svg>

      <div className="hero-stage">
        <Container className="relative z-10 text-center">
          <h1 className="hero-title flex flex-col items-center">
            <span className="masker block">
              <span className="hero-line block" style={{ '--d': '0ms' }}>
                YouTube{' '}
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
            <Image
              src="/icon-black.svg"
              alt=""
              width={1200}
              height={1200}
              sizes="(max-width: 768px) 120vw, 1400px"
              className="hero-mark-base invert"
            />

            {/* <PixelField
              maskSrc="/icon-black.svg"
              pointerTargetRef={sectionRef}
              gap={5}
              radius={460}
              baseAlpha={0}
              peakAlpha={0.7}
              speed={0.0022}
            /> */}

            <div className="hero-mark-edge">
              <Image
                src="/icon-black.svg"
                alt=""
                width={1200}
                height={1200}
                sizes="(max-width: 768px) 120vw, 1400px"
              />
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
