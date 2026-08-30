import { Container, Section, SectionHead } from './ui';
import { AppWindow } from './AppWindow';

const CALLOUTS = [
  { k: 'Thumbnails', v: 'Every row carries its poster frame, title and resolution.' },
  { k: 'Codec labels', v: 'A VP9 file says so, before it reaches your timeline.' },
  { k: 'Reveal in Finder', v: 'One click from the row to the file on disk.' },
  { k: 'Persistent history', v: 'The list survives a restart. Clear it whenever.' },
];

export function Showcase() {
  return (
    <Section beat="chapter" className="overflow-hidden">
      <Container>
        <SectionHead eyebrow="The app" title="Everything on one screen." />

        <div className="mt-14 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7" data-reveal>
            <AppWindow
              src="/screenshot1.png"
              alt="YT-FORGE main window: a URL bar and a download list with five videos, each showing a thumbnail, title and resolution"
            />
          </div>

          <div className="lg:col-span-5 lg:pt-4" data-reveal style={{ '--reveal-delay': '120ms' }}>
            <dl>
              {CALLOUTS.map((c, i) => (
                <div key={c.k} className="border-line-subtle border-t py-5 first:border-t-0 first:pt-0">
                  <dt className="flex items-center gap-2.5">
                    <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-card font-medium">{c.k}</span>
                  </dt>
                  <dd className="text-body text-ink-2 mt-2 max-w-[42ch]">{c.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </Section>
  );
}
