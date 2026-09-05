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
                className="panel panel-interactive group flex flex-col p-6 sm:p-7"
              >
                <span className="border-line-subtle flex size-11 items-center justify-center rounded-[var(--radius-control)] border bg-white/[0.025]">
                  <Icon className="text-ink size-5" />
                </span>

                <h3 className="text-sub mt-6 font-medium">{p.name}</h3>
                <p className="text-small text-ink-2 mt-1.5">{p.tagline}</p>
                <p className="text-meta text-ink-4 mt-1 font-[family-name:var(--font-geist-mono)] uppercase">
                  {p.note}
                </p>

                <a href={primary.href} className="btn btn-primary mt-7 w-full">
                  <DownloadIcon className="size-4" />
                  Download
                </a>

                {extras.length ? (
                  <ul className="mt-3 space-y-1">
                    {extras.map((b) => (
                      <li key={b.href}>
                        <a
                          href={b.href}
                          className="text-small text-ink-3 hover:text-ink flex items-center gap-1.5 transition-colors"
                        >
                          {b.label}
                          <ArrowUpRight className="size-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="text-meta text-ink-4 mt-auto pt-6 font-[family-name:var(--font-geist-mono)] uppercase">
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
            <div>
              <p className="eyebrow">Security notice</p>
              <p className="text-body text-ink-2 mt-4 max-w-[46ch]">
                This is an independent source-available app, so it does not ship with an enterprise
                code-signing certificate. Your operating system may show a warning the first
                time you open it.
              </p>
            </div>

            <div>
              <div className="grid gap-8 sm:grid-cols-2">
                {FIRST_RUN.map((r) => (
                  <div key={r.os}>
                    <p className="text-small text-ink font-medium">{r.os}</p>
                    <ol className="mt-3 space-y-1.5">
                      {r.steps.map((step, i) => (
                        <li
                          key={step}
                          className="text-small text-ink-2 flex items-baseline gap-2 font-[family-name:var(--font-geist-mono)]"
                        >
                          <span className="text-ink-4 shrink-0">
                            {i === 0 ? '\u00A0' : '\u2192'}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

              <div className="border-line-subtle mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t pt-5">
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
