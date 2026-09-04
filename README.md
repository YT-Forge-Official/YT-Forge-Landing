# YT-FORGE Landing Page

This repository contains the marketing and landing page for **YT-FORGE**. 

It is a standalone Next.js application that resides within the main Electron repository but is decoupled from the desktop app's build process. This allows for independent deployment to platforms like Vercel without requiring the desktop toolchain.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Local Development

Navigate to the `landing` directory and install the dependencies:

```bash
cd landing
npm install
```

To start the local development server:

```bash
npm run dev
```
The site will be available at `http://localhost:3000`.

To build and serve the production version locally:
```bash
npm run build
npm start
```

*Note: From the repository root, you can alternatively use `npm run landing:dev` and `npm run landing:build`.*

> **⚠️ Warning:** Avoid running `npm run build` while the development server (`npm run dev`) is active. Both processes share the `.next/` directory, which can cause Webpack errors (e.g., `__webpack_modules__ is not a function`). If this occurs, stop the development server, remove the `.next` directory (`rm -rf .next`), and restart.

## Project Structure

```text
app/
├── layout.jsx      # Global fonts, metadata (OG, Twitter, icons)
├── page.jsx        # Main page assembly and section ordering
└── globals.css     # Global styles, design tokens, and keyframes
components/         # Page sections and UI primitives (ui.jsx)
lib/
├── site.js         # Single source of truth for version, links, and copy
├── github.js       # GitHub API integration for star/fork counts (revalidated hourly)
└── reveal.js       # IntersectionObserver logic for scroll animations ([data-reveal])
public/             # Static assets (icons, banners, screenshots)
```

## Release Management

When shipping a new version of the YT-FORGE desktop application, you must update the version number on the landing page to ensure the download links serve the correct assets.

1. Open `lib/site.js`.
2. Update the `VERSION` constant. 

This single change will update all download URLs, hero text, CTA labels, and footer references.

**Important:** The download links rely on the specific casing output by `electron-builder` (`YT-Forge`, not `YT-FORGE`). Ensure the GitHub release assets match this format:

- `YT-Forge-<version>-arm64.dmg` (macOS Apple Silicon)
- `YT-Forge-Setup-<version>.exe` (Windows x64 + ARM)
- `YT-Forge-<version>.AppImage` (Linux x64)
- `YT-Forge-<version>-arm64.AppImage` (Linux ARM)

*To add a new platform (e.g., an Intel Mac build), append it to the corresponding `builds` array within the `PLATFORMS` object in `lib/site.js`. The UI will automatically render it as a secondary download link.*

## Design System

The design utilizes a monochrome palette with a single accent color (`--color-ember: #ff6a2b`), applied sparingly to roughly 5% of the UI. All styling configuration is located in `app/globals.css`.

- **Surfaces:** `--color-bg` (`#08090a`) to `--color-bg-hover` (`#1c1d20`)
- **Hairlines:** `--color-line-subtle` (6% opacity) to `--color-line-hover` (24% opacity)
- **Typography:**
  - Body: Geist
  - Labels/Numbers: Geist Mono
  - Wordmark: Poppins (matches the primary banner)
- **Radii:** 6px (controls), 10px (cards), 14px (panels)
- **Composites:** `.panel`, `.btn`, `.eyebrow`, `.halftone`, `.rule` are defined in `@layer components` to allow Tailwind utility overrides.

### Animations
To add a scroll reveal animation, apply the `data-reveal` attribute to an element. You can stagger animations using `style={{ '--reveal-delay': '120ms' }}`. 

*Note: All animations respect the `prefers-reduced-motion` media query.*

## Deployment

The application is deployed to Vercel. Since it operates as a standalone Next.js project within the larger repository, Vercel's **Root Directory** must be configured to `./`.

Deployments are triggered automatically upon pushing to the `main` branch. The site is primarily statically generated, with hourly revalidation for GitHub statistics.

**Configuration Requirements:**
- The `metadataBase` in `app/layout.jsx` must exactly match the production domain to ensure Open Graph and Twitter image URLs resolve correctly.
