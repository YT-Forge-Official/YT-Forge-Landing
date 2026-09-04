import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This app lives inside the Electron repo, which has its own lockfile.
  // Pin tracing to this folder so Next stops guessing the workspace root.
  outputFileTracingRoot: here,
  /*
    Optimisation ON. With it off, every raster on the page was served at its
    full authoring size: a 1 MB avatar for an 88px circle, 130 KB editor icons
    for an 80px tile, half-megabyte screenshots. Next now serves AVIF/WebP at
    the width each `sizes` actually asks for, which is most of the page's
    weight gone. SVGs opt out per-call with `unoptimized` — there is nothing
    to recompress and the optimiser only adds a round trip.
  */
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
