import { Download as DownloadIcon, ArrowUpRight } from 'lucide-react';
import { PLATFORMS, VERSION, LATEST_URL, RELEASES_URL } from '@/lib/site';
import { Container, Section, SectionHead } from './ui';
import { AppleIcon, WindowsIcon, LinuxIcon } from './icons';

const ICONS = { mac: AppleIcon, windows: WindowsIcon, linux: LinuxIcon };

const FIRST_RUN = [
  { os: 'macOS', steps: ['System Settings', 'Privacy & Security', 'Open Anyway'] },
  { os: 'Windows', steps: ['More Info', 'Run Anyway'] },
];

export function Download() {
  return (
    <Section id="download" beat="chapter">
      <Container>
        <SectionHead eyebrow="Download" title={`Version ${VERSION}.`} dim="Free." />

        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
          {PLATFORMS.map((p, i) => {
            const Icon = ICONS[p.id];
            const primary = p.builds.find((b) => b.primary) ?? p.builds[0];
            const extras = p.builds.filter((b) => b !== primary);

            return (
              <div
                key={p.id}
                data-reveal
                style={{ '--reveal-delay': `${i * 90}ms` }}
                className="panel panel-interactive group flex flex-wrap items-center gap-3 p-4 md:flex-col md:flex-nowrap md:items-stretch md:gap-0 md:p-7"
              >
                <span className="border-line-subtle flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border bg-white/[0.025] md:size-11">
                  <Icon className="text-ink size-5" />
                </span>

                {/* min-w-0 so a long note ellipses inside the row instead of
                    shoving the button off the card. */}
                <div className="min-w-0 flex-1 md:mt-6 md:flex-none">
                  <h3 className="text-card font-medium md:text-sub">{p.name}</h3>

                  {/* Phones get ONE meta line: the file type, then who the
                      build is for. The tagline and the build label stacked
                      underneath it say the same fact three ways, and that
                      repetition is most of what made these cards so tall. */}
                  <p className="text-small text-ink-2 mt-0.5 truncate md:hidden">
                    <span className="font-[family-name:var(--font-geist-mono)]">{p.ext}</span>
                    <span className="text-ink-4"> · </span>
                    {p.note}
                  </p>

                  <p className="text-small text-ink-2 max-md:hidden md:mt-1.5">{p.tagline}</p>
                  <p className="text-meta text-ink-4 mt-1 font-[family-name:var(--font-geist-mono)] uppercase max-md:hidden">
                    {p.note}
                  </p>
                </div>

                {/* Square on a phone. "Download" is already the section
                    heading three lines up and the arrow carries the rest, so
                    the word was buying nothing and costing the meta line the
                    width it needs. Still 44px, so the tap target is intact,
                    and the label moves to aria-label rather than being lost —
                    which also disambiguates three identical links for a
                    screen reader on desktop. */}
                <a
                  href={primary.href}
                  aria-label={`Download YT-FORGE for ${p.name}`}
                  className="btn btn-primary shrink-0 max-md:size-11 max-md:px-0 md:mt-7 md:w-full"
                >
                  <DownloadIcon className="size-4" />
                  <span className="max-md:hidden">Download</span>
                </a>

                {extras.length ? (
                  <ul className="space-y-1 max-md:w-full md:mt-3">
                    {extras.map((b) => (
                      <li key={b.href}>
                        <a
                          href={b.href}
                          className="text-small text-ink-3 hover:text-ink flex items-center gap-1.5 transition-colors max-md:border-line-subtle max-md:border-t max-md:pt-3"
                        >
                          {b.label}
                          <ArrowUpRight className="size-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="text-meta text-ink-4 mt-auto pt-6 font-[family-name:var(--font-geist-mono)] uppercase max-md:hidden">
                  {primary.label}
                </p>
              </div>
            );
          })}
        </div>

        {/*
          Deliberately not a panel. This is a note about the software, not
          another thing to choose, so it sits on the page under a hairline
          rather than in a box competing with the three cards above it.
        */}
        <div className="mt-12" data-reveal>
          <div className="rule" />

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
              <p className="eyebrow">Security notice</p>
              <p className="text-body text-ink-2 mt-4 max-w-[46ch]">
                This is an independent source-available app, so it does not ship with an enterprise
                code-signing certificate. Your operating system may show a warning the first
                time you open it.
              </p>
            </div>

            <div>
              <div className="grid gap-8 sm:grid-cols-2 text-center sm:text-left">
                {FIRST_RUN.map((r) => (
                  <div key={r.os} className="flex flex-col items-center sm:items-start">
                    <p className="text-small text-ink font-medium">{r.os}</p>
                    <ol className="mt-4 sm:mt-3 flex flex-col sm:block space-y-2 sm:space-y-1.5 text-center sm:text-left">
                      {r.steps.map((step, i) => (
                        <li
                          key={step}
                          className="text-small text-ink-2 flex flex-col sm:flex-row items-center sm:items-baseline gap-2 font-[family-name:var(--font-geist-mono)]"
                        >
                          {i !== 0 && (
                            <span className="text-ink-4 shrink-0 sm:hidden">
                              {'\u2193'}
                            </span>
                          )}
                          <span className="text-ink-4 shrink-0 w-3 text-right hidden sm:inline-block">
                            {i === 0 ? '' : '\u2192'}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

              <div className="border-line-subtle mt-8 flex flex-col sm:flex-row items-center justify-between gap-x-8 gap-y-4 border-t pt-5 text-center sm:text-left">
                <p className="text-small text-ink-4">Approval is needed once, not every launch.</p>

                <div className="flex flex-wrap gap-x-7 gap-y-3">
                  <a
                    href={LATEST_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-small text-ink-2 hover:text-ink flex items-center gap-1.5 transition-colors"
                  >
                    Latest release
                    <ArrowUpRight className="size-3.5" />
                  </a>
                  <a
                    href={RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-small text-ink-2 hover:text-ink flex items-center gap-1.5 transition-colors"
                  >
                    All versions
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </Container>
    </Section>
  );
}
