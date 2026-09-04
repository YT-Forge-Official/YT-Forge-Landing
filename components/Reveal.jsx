'use client';

import { useReveal, useFooterReveal } from '@/lib/reveal';

/** Mounts the page-level observers: scroll reveal, and the guard that
 *  enables the footer reveal only when the footer actually fits. */
export function Reveal() {
  useReveal();
  useFooterReveal();
  return null;
}
