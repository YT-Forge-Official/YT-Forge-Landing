import Image from 'next/image';
import { EDITORS } from '@/lib/site';

/**
 * Editor-logo marquee — greyscale logos with names,
 * uniformly sized, infinite horizontal scroll.
 * Replaces the old brand-band with banner art + text marquee.
 */
export function BrandBand() {
  // Triple the list for seamless looping
  const items = EDITORS.concat(EDITORS, EDITORS);

  return (
    <section className="relative overflow-hidden py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        {/* top hairline */}
        <div className="rule" />

        <p
          className="eyebrow mt-6 text-center"
          data-reveal
        >
          Drops straight into
        </p>
      </div>

      {/* marquee strip */}
      <div
        className="group fade-x mt-6 flex w-full overflow-hidden"
        data-reveal
        style={{ '--reveal-delay': '120ms' }}
      >
        <div className="anim-marquee flex w-max shrink-0 items-center">
          {items.map((editor, i) => (
            <span key={i} className="flex items-center">
              <span className="flex items-center gap-2.5 px-6 sm:gap-3 sm:px-8">
                <Image
                  src={editor.icon}
                  alt={editor.name}
                  width={36}
                  height={36}
                  className="editor-marquee-logo size-8 shrink-0 rounded-[8px] sm:size-9"
                  sizes="36px"
                />
                <span className="text-small text-ink-2 font-medium whitespace-nowrap">
                  {editor.name}
                </span>
              </span>
              <span className="bg-line-subtle h-4 w-px shrink-0" />
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-[1200px] px-5 sm:px-8">
        {/* bottom hairline */}
        <div className="rule" />
      </div>
    </section>
  );
}
