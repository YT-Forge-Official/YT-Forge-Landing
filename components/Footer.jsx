import { REPO_URL, RELEASES_URL } from '@/lib/site';
import { Container } from './ui';
import { GitHubIcon } from './icons';
import { Logo } from './Logo';
import { DeveloperPanel } from './DeveloperPanel';

const BUILT_ON = [
  { label: 'yt-dlp', href: 'https://github.com/yt-dlp/yt-dlp' },
  { label: 'FFmpeg', href: 'https://ffmpeg.org' },
  { label: 'Electron', href: 'https://electronjs.org' },
  { label: 'React', href: 'https://react.dev' },
];

export function Footer() {
  return (
    /*
      The footer sits UNDER the page. It is sticky at bottom:0 with the whole
      page-sheet stacked above it, so the last stretch of scrolling slides the
      page up like a sheet of paper and the footer is simply already there.
    */
    <footer className="footer-reveal border-line-subtle border-t">
      <Container className="pt-11 pb-0">
        {/* The developer half is the wider one — it is the part with something
            to say. The project half is a masthead and a short link list. */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-8">
          {/* ——— the project ——— */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Logo />
            <p className="text-small text-ink-2 mt-5 max-w-[24ch]">
              A blazing fast, minimalist desktop video downloader and yt-dlp GUI wrapper for Mac, Windows, and Linux
            </p>

            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="border-line hover:border-line-hover text-small inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border px-3.5 transition-colors"
              >
                <GitHubIcon className="size-3.5" />
                Source
              </a>
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                className="border-line hover:border-line-hover text-small inline-flex h-9 items-center rounded-[var(--radius-control)] border px-3.5 transition-colors"
              >
                Releases
              </a>
            </div>

            <p className="eyebrow mt-8">Built on</p>
            <ul className="mt-4 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2.5">
              {BUILT_ON.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-small text-ink-2 hover:text-ink transition-colors duration-150"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ——— the developer ——— */}
          <div className="border-line-subtle lg:border-l lg:pl-10">
            <p className="eyebrow">About developer</p>

            <div className="mt-6">
              <DeveloperPanel />
            </div>
          </div>
        </div>

        <div className="rule my-8" />

        <div className="flex flex-col gap-3 text-center lg:text-left items-center lg:items-start">
          <p className="text-small text-ink-4 max-w-[80ch]">
            YT-FORGE is a graphical interface for the open-source yt-dlp project. It does not
            modify or circumvent that software, and it does not break access controls. Download
            only content you have permission to access or distribute.
          </p>
         
        </div>
      </Container>

      {/* The wordmark the page lifts off of. Clipped at the baseline so it
          reads as carved into the bottom edge rather than typeset above it. */}
      <div aria-hidden className="footer-wordmark-clip">
        <p className="footer-wordmark">YT-FORGE</p>
      </div>
    </footer>
  );
}
