'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { YT_DLP_URL, YT_DLP_STARS } from '@/lib/site';
import { Container } from './ui';
import { StarIcon } from './icons';
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
export function Hero() {
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
                ,
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
          {/*
            One grid drives both cells, so the eyebrows share a row and the
            marks share a row — alignment is structural, not eyeballed. `--gh`
            is the yt-dlp glyph height; the lockup is cropped to its ink so it
            optically matches the numerals.
          */}
          <div
            className="relative mx-auto grid w-full max-w-[560px] grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center gap-y-3 py-8 sm:gap-y-4"
            data-reveal
            style={{ '--reveal-delay': '220ms', '--gh': 'clamp(26px, 3vw, 42px)' }}
          >
            <span className="eyebrow text-ink-4 justify-self-center">Powered by</span>

            <span
              aria-hidden
              className="row-span-2 h-full w-px"
              style={{
                background:
                  'linear-gradient(180deg, transparent, rgba(255,255,255,0.2) 22%, rgba(255,255,255,0.2) 78%, transparent)',
              }}
            />

            <span className="eyebrow text-ink-4 justify-self-center">Trusted by</span>

            <a
              href={YT_DLP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="yt-dlp on GitHub"
              className="group relative justify-self-center"
            >
              <span
                aria-hidden
                className="absolute -inset-x-6 -inset-y-3 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(60% 120% at 50% 50%, rgba(255,255,255,0.13), transparent 70%)',
                }}
              />
              <span
                className="relative block overflow-hidden"
                style={{ height: 'var(--gh)', width: 'calc(var(--gh) * 433 / 189)' }}
              >
                <Image
                  src="/yt-dlp.png"
                  alt="yt-dlp"
                  width={500}
                  height={500}
                  className="block max-w-none opacity-[0.88] grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                  style={{
                    width: 'calc(var(--gh) * 500 / 189)',
                    height: 'calc(var(--gh) * 500 / 189)',
                    marginTop: 'calc(var(--gh) * -155 / 189)',
                    marginLeft: 'calc(var(--gh) * -34 / 189)',
                  }}
                />
              </span>
            </a>

            <span
              aria-label={`yt-dlp has ${YT_DLP_STARS} stars on GitHub`}
              className="flex items-center justify-self-center"
              style={{ height: 'var(--gh)' }}
            >
              <span
                className="text-ink-3 block shrink-0"
                style={{
                  width: 'calc(var(--gh) * 0.46)',
                  height: 'calc(var(--gh) * 0.46)',
                  marginRight: 'calc(var(--gh) * 0.28)',
                }}
              >
                <StarIcon className="size-full" />
              </span>
              <span
                className="text-ink-deck font-[family-name:var(--font-geist-mono)] leading-none font-medium tabular-nums"
                style={{ fontSize: 'calc(var(--gh) * 1.18)', letterSpacing: '-0.03em' }}
              >
                {YT_DLP_STARS}
              </span>
            </span>
          </div>
        </Container>
      </div>
    </section>
  );
}
