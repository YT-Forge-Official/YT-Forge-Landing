import { Container, Section, SectionHead } from './ui';
import { AppWindow } from './AppWindow';

const CALLOUTS = [
  { k: 'Thumbnails', v: 'Every row carries its poster frame, title and resolution.' },
  { k: 'Codec labels', v: 'A VP9 file says so, before it reaches your timeline.' },
  { k: 'Reveal in Folder', v: 'One click from the row to the file on disk.' },
  { k: 'Persistent history', v: 'The list survives a restart. Clear it whenever.' },
];

export function Showcase() {
  return (
    <Section beat="section" className="overflow-hidden">
      <Container>
        <SectionHead title="Clean, minimal UI." />

        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:items-stretch lg:gap-14">
          <div className="lg:col-span-7" data-reveal>
            <AppWindow
              src="/screenshot1.png"
              alt="YT-FORGE main window: a URL bar and a download list with five videos, each showing a thumbnail, title and resolution"
            />
          </div>

          {/*
            One aligned system: a fixed number column, a hairline between each
            row, equal breathing room above and below the text block — the
            list reads as a single instrument panel, not four stray notes.
          */}
          {/* The rows split the window's full height between them, so the two
              columns read as one composed block rather than a tall image with
              a short list floating beside it. */}
          <dl className="flex flex-col lg:col-span-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {CALLOUTS.map((c, i) => (
              <div
                key={c.k}
                className="border-line-subtle grid flex-1 grid-cols-[3rem_1fr] content-center items-baseline border-t py-5 first:border-t-0 first:pt-0 last:pb-0"
              >
                <dt className="contents">
                  <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-card font-medium">{c.k}</span>
                </dt>
                <dd className="text-body text-ink-2 col-start-2 mt-2 max-w-[40ch]">{c.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </Section>
  );
}
