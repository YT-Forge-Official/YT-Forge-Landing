'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { PLATFORMS, VERSION } from '@/lib/site';
import { clsx } from '@/lib/clsx';
import { motion } from "framer-motion";

function detect() {
  if (typeof navigator === 'undefined') return null;
  const ua = `${navigator.userAgent} ${navigator.platform || ''}`.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux') || ua.includes('x11')) return 'linux';
  return null;
}

/**
 * Resolves the visitor's own OS build. Returns nulls on the server and on the
 * first client render, so markup matches and there is no hydration mismatch;
 * the real platform lands on mount.
 */
export function usePlatform() {
  const [id, setId] = useState(null);

  useEffect(() => setId(detect()), []);

  const platform = PLATFORMS.find((p) => p.id === id) ?? null;
  const build = platform?.builds.find((b) => b.primary) ?? platform?.builds[0] ?? null;

  return { platform, build };
}

/**
 * Primary CTA that resolves to the visitor's own OS build.
 */
export function PlatformCta({ className, size = 'lg' }) {
  const { platform, build } = usePlatform();

  return (
    <div data-scroll data-scroll-section data-scroll-speed="-0.2"  className={clsx('flex flex-col items-center gap-2.5', className)}>
      <a
        href={build?.href ?? '#download'}
        className={clsx('btn btn-primary group', size === 'lg' && 'h-12 px-7 text-base')}
      >
        <Download className="size-4 transition-transform duration-300" />
        {platform ? `Download for ${platform.name}` : 'Download free'}
      </a>
      <p className="text-meta text-ink-4 font-[family-name:var(--font-geist-mono)] uppercase">
        {VERSION}
        {platform ? ` · ${platform.ext} · ${platform.tagline}` : ' · macOS · Windows · Linux'}
      </p>
    </div>
  );
}
