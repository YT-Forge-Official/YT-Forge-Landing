'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { YT_DLP_URL, YT_DLP_STARS } from '@/lib/site';
import { Container } from './ui';
import { StarIcon } from './icons';
import { PlatformCta } from './PlatformCta';
import { PixelField } from './PixelField';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Hero() {
  const sectionRef = useRef(null);
  const markRef = useRef(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 180]);

  useEffect(() => {
    const section = sectionRef.current;
    const mark = markRef.current;
    if (!section || !mark) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const onMove = (e) => {
      const rect = mark.getBoundingClientRect();
      mark.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      mark.style.setProperty('--my', `${e.clientY - rect.top}px`);
      mark.style.setProperty('--hover', '1');
    };
    const onLeave = () => mark.style.setProperty('--hover', '0');

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section id="top" ref={sectionRef} className="hero relative flex min-h-[85svh] flex-col overflow-hidden pt-28 sm:pt-36">
      {/* ——— TEXT AREA ——— */}
      <Container className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl mb-16">
          <h1 className="text-hero font-medium flex flex-col items-center">
            <span className="masker block">
              <span className="hero-line block" style={{ '--d': '0ms' }}>
                YouTube{' '}
                <span className="relative inline-block px-2 mx-0.5">
                  <span>downloads</span>
                  <motion.span
                    className="absolute inset-0 bg-ink text-bg overflow-hidden whitespace-nowrap rounded-[8px]"
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
              <span className="hero-line block" style={{ '--d': '150ms' }}>finally done right.</span>
            </span>
          </h1>
        </div>
      </Container>

      {/* SVG filter: extracts only the edges of the logo shape, coloured */}
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

      {/* ——— THE MARK & THE BAR ——— */}
      <div className="relative w-full mt-[15rem] sm:mt-[20rem]">
        {/* The Mark - Anchored to the bar's top edge so it is exactly cut in half */}
        <motion.div style={{ y }} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-0 justify-center">
          <div
            ref={markRef}
            className="pointer-events-none absolute top-0 flex -translate-y-1/2 items-center justify-center"
            style={{
              '--mx': '50%',
              '--my': '50%',
              '--hover': '0',
              maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)'
            }}
          >
            {/* Subtle solid grey logo layer */}
            <Image
              src="/icon-black.svg"
              alt=""
              width={1200}
              height={1200}
              sizes="90vw"
              className="absolute h-[80vh] w-auto object-contain invert opacity-[0.09] sm:h-[120vh]"
            />

            {/* dim pixel field — always alive, lit radially from the cursor */}
            <PixelField
              maskSrc="/icon-black.svg"
              pointerTargetRef={sectionRef}
              gap={9}
              radius={460}
              baseAlpha={0.0}
              peakAlpha={0.5}
              speed={0.0022}
              className="relative z-10 aspect-square h-[80vh] sm:h-[120vh]"
            />

            {/* edge-only glow layer — strictly masked to a circle around the cursor */}
            <div
              className="absolute inset-0 transition-opacity duration-500 z-20"
              style={{
                opacity: 'var(--hover)',
                maskImage: 'radial-gradient(circle 350px at var(--mx) var(--my), black, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(circle 350px at var(--mx) var(--my), black, transparent 100%)',
              }}
            >
              <Image
                src="/icon-black.svg"
                alt=""
                width={1200}
                height={1200}
                sizes="90vw"
                className="h-[80vh] w-auto object-contain sm:h-[120vh]"
                style={{ filter: 'url(#edge-glow) drop-shadow(0 0 6px rgba(255,255,255,0.45))' }}
              />
            </div>
          </div>
        </motion.div>

        {/* The Opaque Bar */}
        <div className="relative z-20 w-full border-t border-white/10 bg-[var(--color-bg)]">
          {/* hairline that brightens toward the centre */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-px h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.26) 32%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.26) 68%, transparent)',
            }}
          />
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
              Two mirrored cells around a centre rule. One grid drives both, so
              the eyebrows share a row and the marks share a row — alignment is
              structural, not eyeballed. `--gh` is the yt-dlp glyph height; the
              lockup is cropped to its ink so it optically matches the numerals.
            */}
            <div
              className="relative mx-auto grid w-full max-w-[560px] grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center gap-y-3 py-8 sm:gap-y-4 sm:py-8"
              data-reveal
              style={{ '--reveal-delay': '220ms', '--gh': 'clamp(28px, 3.2vw, 44px)' }}
            >
              <span className="eyebrow justify-self-center text-lg text-ink-4">Powered by</span>

              {/* centre rule — fades out at both ends */}
              <span
                aria-hidden
                className="row-span-2 h-full w-px"
                style={{
                  background:
                    'linear-gradient(180deg, transparent, rgba(255,255,255,0.2) 22%, rgba(255,255,255,0.2) 78%, transparent)',
                }}
              />

              <span className="eyebrow justify-self-center text-lg text-ink-4">Trusted by</span>

              {/* yt-dlp lockup */}
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
                  style={{ background: 'radial-gradient(60% 120% at 50% 50%, rgba(255,255,255,0.13), transparent 70%)' }}
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

              {/* yt-dlp's GitHub stars */}
              <a
                target="_blank"
                rel="noreferrer"
                aria-label={`yt-dlp has ${YT_DLP_STARS} stars on GitHub`}
                className="group flex items-center justify-self-center"
                style={{ height: 'var(--gh)' }}
              >
                <span
                  className="block shrink-0 text-ink-3 transition-colors duration-300 group-hover:text-ink"
                  style={{
                    width: 'calc(var(--gh) * 0.46)',
                    height: 'calc(var(--gh) * 0.46)',
                    marginRight: 'calc(var(--gh) * 0.28)',
                  }}
                >
                  <StarIcon className="size-full" />
                </span>
                <span
                  className="font-medium leading-none tabular-nums text-ink-deck font-[family-name:var(--font-geist-mono)] transition-colors duration-300 group-hover:text-ink"
                  style={{ fontSize: 'calc(var(--gh) * 1.18)', letterSpacing: '-0.03em' }}
                >
                  {YT_DLP_STARS}
                </span>
              </a>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
