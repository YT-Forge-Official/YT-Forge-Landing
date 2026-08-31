import Image from 'next/image';
import { SOCIALS, YOUTUBE } from '@/lib/site';
import { GitHubIcon, YouTubeMark, LinkedInMark, InstagramMark } from './icons';

const MARKS = {
  github: GitHubIcon,
  linkedin: LinkedInMark,
  instagram: InstagramMark,
};

const STATS = [
  { k: 'Subscribers', v: YOUTUBE.subs },
  { k: 'Views', v: YOUTUBE.views },
  { k: 'Videos', v: YOUTUBE.videos },
];

/**
 * One panel, divided by hairlines — the same construction the rest of the page
 * uses. The channel and the links are not two components sitting near each
 * other; they are rows of a single surface, which is what stops the channel
 * reading as a widget pasted into the footer.
 *
 * Nothing here moves on hover. Colour is the only state change.
 */
export function DeveloperPanel() {
  return (
    <div className="dev-panel">
      {/* ——— channel ——— */}
      <a
        href={YOUTUBE.href}
        target="_blank"
        rel="noreferrer"
        className="dev-head group"
        aria-label={`${YOUTUBE.name} on YouTube`}
      >
        <span className="dev-avatar">
          <Image
            src={YOUTUBE.avatar}
            alt=""
            width={512}
            height={512}
            sizes="88px"
            className="h-full w-full rounded-full object-cover"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="dev-name">{YOUTUBE.name}</span>
          {/* The mark belongs here, on the dark surface — that is the way
              round it is designed to be seen. */}
          <span className="dev-handle">
            {/* <YouTubeMark className="dev-yt-mark" /> */}
            {YOUTUBE.handle}
          </span>
        </span>

        <span className="dev-subscribe">Subscribe</span>
      </a>

      {/* ——— stats ——— */}
      <dl className="dev-stats">
        {STATS.map((s) => (
          <div key={s.k} className="dev-stat">
            <dt className="dev-stat-k">{s.k}</dt>
            <dd className="dev-stat-v">{s.v}</dd>
          </div>
        ))}
      </dl>

      {/* ——— everywhere else ——— */}
      <ul className="dev-links">
        {SOCIALS.map((s) => {
          const Mark = MARKS[s.id];
          return (
            <li key={s.id}>
              <a href={s.href} target="_blank" rel="noreferrer" className="dev-link group">
                <Mark className="dev-link-mark" />
                <span className="dev-link-label">{s.label}</span>
                <span className="dev-link-handle">{s.handle}</span>
                <span className="dev-link-arrow" aria-hidden>
                  →
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
