import { GitFork, CircleDot, Scale, ArrowUpRight } from 'lucide-react';
import { REPO_URL, ISSUES_URL } from '@/lib/site';
import { Container, Section } from './ui';
import { GitHubIcon, StarIcon } from './icons';

/*
  The project is source-available, not open source: PolyForm Noncommercial
  1.0.0. That distinction is the whole reason this section does not say
  "open source" anywhere — read, fork, study and modify are all fine, selling
  it is not, and claiming an OSI licence we do not carry would be a lie a
  reader can check against the LICENSE file one click away.
*/
export function SourceAvailable({ stats }) {
  const tiles = [
    { icon: StarIcon, label: 'Stars', value: stats?.stars ?? '—', href: `${REPO_URL}/stargazers` },
    { icon: GitFork, label: 'Forks', value: stats?.forks ?? '—', href: `${REPO_URL}/forks` },
    { icon: CircleDot, label: 'Open issues', value: stats?.issues ?? '—', href: ISSUES_URL },
    {
      icon: Scale,
      label: 'Noncommercial license',
      value: 'PolyForm',
      href: `${REPO_URL}/blob/main/LICENSE`,
    },
  ];

  return (
    <Section beat="section">
      <Container>
        <div className="panel panel-lg relative overflow-hidden">
          <div aria-hidden className="halftone pointer-events-none absolute inset-0 opacity-50" />

          <div className="relative grid grid-cols-1 gap-10 p-7 sm:p-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6 flex flex-col items-center text-center lg:items-start lg:text-left">
              <p className="eyebrow" data-reveal>
                Source available
              </p>
              <h2 className="text-section mt-4 font-medium text-balance" data-reveal>
                Star the repo?
              </h2>
              <p className="text-body text-ink-2 mt-5 max-w-[50ch]" data-reveal>
                The whole source is on GitHub, so have a poke around and see how it actually
                works. Read it, fork it, build it yourself &mdash; it&rsquo;s free for personal
                and noncommercial use. If you like what you find, a star goes a long way, and it
                helps other people find it too :)
              </p>

              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto" data-reveal>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-primary w-full sm:w-auto justify-center">
                  <GitHubIcon />
                  Star on GitHub
                </a>
                <a href={ISSUES_URL} target="_blank" rel="noreferrer" className="btn btn-ghost w-full sm:w-auto justify-center">
                  Report an issue
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

            </div>

            <div className="lg:col-span-6">
              <div className="border-line-subtle grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border bg-white/[0.012]">
                {tiles.map((t, i) => (
                  <a
                    key={t.label}
                    href={t.href}
                    target="_blank"
                    rel="noreferrer"
                    data-reveal
                    style={{ '--reveal-delay': `${i * 70}ms` }}
                    className="border-line-subtle hover:bg-bg-hover group p-6 transition-colors duration-200 border-t first:border-t-0 sm:border-t-0 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(n+3)]:border-t"
                  >
                    <div className="flex items-center justify-between">
                      <t.icon className="text-ink-3 size-3.5" />
                      <ArrowUpRight className="text-ink-4 size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-6 font-[family-name:var(--font-geist-mono)] text-[22px] sm:text-[30px] leading-none tracking-[-0.03em] tabular-nums truncate">
                      {t.value}
                    </p>
                    <p className="eyebrow mt-2.5">{t.label}</p>
                  </a>
                ))}
              </div>

            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
