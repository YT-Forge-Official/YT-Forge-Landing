'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { REPO_URL } from '@/lib/site';
import { Container } from './ui';
import { GitHubIcon, StarIcon } from './icons';
import { PlatformCta } from './PlatformCta';
import { PixelField } from './PixelField';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Hero({ stars }) {
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
    <section id="top" ref={sectionRef} className="hero relative flex min-h-[80svh] flex-col overflow-hidden pt-20 sm:pt-30">
      {/* ——— TEXT AREA ——— */}
      <Container className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl mb-16">
          <h1
            className="text-hero font-medium "
            data-reveal
            style={{ '--reveal-delay': '60ms' }}
          >
            YouTube downloads,{' '}
            <span className="dim">finally done right.</span>
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
      <div className="relative w-full mt-50 sm:mt-70">
        {/* The Mark - Anchored to the bar's top edge so it is exactly cut in half */}
        <motion.div style={{ y }} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-0 justify-center">
          <div
            ref={markRef}
            className="pointer-events-none absolute top-0 flex -translate-y-1/2 items-center justify-center"
            style={{ '--mx': '50%', '--my': '50%', '--hover': '0' }}
          >
            {/* dim pixel field — always alive, lit radially from the cursor */}
            <PixelField
              maskSrc="/icon-black.svg"
              pointerTargetRef={sectionRef}
              gap={9}
              radius={460}
              baseAlpha={0.25}
              peakAlpha={0.5}
              speed={0.0022}
              className="aspect-square h-[80vh] sm:h-[120vh]"
            />

            {/* edge-only glow layer — masked to a circle around the cursor */}
            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                opacity: 'calc(0.7 + 0.3 * var(--hover))',
                maskImage: 'radial-gradient(circle 700px at var(--mx) var(--my), black, rgba(0,0,0,0.45) 70%)',
                WebkitMaskImage: 'radial-gradient(circle 700px at var(--mx) var(--my), black, rgba(0,0,0,0.45) 70%)',
              }}
            >
              <Image
                src="/icon-black.svg"
                alt=""
                width={1200}
                height={1200}
                sizes="90vw"
                className="h-[80vh] w-auto object-contain opacity-70 sm:h-[120vh]"
                style={{ filter: 'url(#edge-glow) drop-shadow(0 0 4px rgba(255,255,255,0.5))' }}
              />
            </div>
          </div>
        </motion.div>

        {/* The Opaque Bar */}
        <div className="relative z-20 w-full border-t border-white/10 bg-[var(--color-bg)]">
          <Container>
            <div
              className="flex flex-col items-center justify-center gap-4 py-10 sm:flex-row sm:gap-6"
              data-reveal
              style={{ '--reveal-delay': '220ms' }}
            >
              <PlatformCta />
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost h-12 px-6 text-base"
              >
                <GitHubIcon />
                Source
                {stars ? (
                  <span className="text-ink-3 ml-1 flex items-center gap-1 font-[family-name:var(--font-geist-mono)] text-[13px]">
                    <StarIcon className="size-3" />
                    {stars}
                  </span>
                ) : null}
              </a>
            </div>

            <p
              className="pb-10 text-center text-small text-ink-4"
              data-reveal
              style={{ '--reveal-delay': '300ms' }}
            >
              Sits on top of the yt-dlp engine you already trust.
            </p>
          </Container>
        </div>
      </div>
    </section>
  );
}
