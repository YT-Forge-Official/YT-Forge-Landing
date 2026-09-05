import {
  Film,
  Maximize2,
  ListVideo,
  RefreshCw,
  Image as ImageIcon,
  Zap,
  KeyRound,
  ChevronLeft,
  Pause,
  X,
  SkipForward,
  Check,
} from 'lucide-react';
import { Container, Section, SectionHead } from './ui';
import { UpdateCheckIcon } from './icons';

export function Features() {
  return (
    <Section id="features" beat="chapter">
      <Container>
        <SectionHead eyebrow="Features" title="Reliable, by design.
" />

        <div className="mt-10 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <Card
            span={7}
            n="01"
            icon={Film}
            title="H.264 + AAC, picked for you"
            body="Same video, three different codecs. You get the one that actually plays on a timeline."
          >
            <CodecRank />
          </Card>

          <Card
            span={5}
            n="02"
            icon={Maximize2}
            title="Up to 8K"
            body="If the video is in 8K, you get it in 8K."
            delay={80}
          >
            <ResolutionLadder />
          </Card>

          {/* Convert and speed share the narrow half: neither needs a full column
              of height, and stacking them leaves the queue room to breathe. */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <Card
              n="03"
              icon={RefreshCw}
              title="Convert on the fly"
              body="Re-encode VP9 or AV1 to H.264 without leaving the app."
              delay={80}
            >
              <ConvertStrip />
            </Card>

            <Card
              n="04"
              icon={ImageIcon}
              title="Grab the thumbnail too"
              body="Full-resolution cover art, just a click away."
              delay={160}
            />

            <Card
              n="05"
              icon={Zap}
              title="Super fast downloads"
              body="Files come straight to your disk. Nothing sits in between slowing it down."
              delay={240}
            />
          </div>

          <Card
            span={7}
            n="06"
            icon={ListVideo}
            title="Playlists and queues"
            body="Paste a playlist and it downloads the whole thing, one video after another."
          >
            <PlaylistQueue />
          </Card>

          <Card
            span={7}
            n="07"
            icon={KeyRound}
            title="Sign in with Google"
            body={
              <>
                Some videos need an account to watch. (eg. Age-Restricted videos or Members only)<br />
                Sign in once and those download like any other.
              </>
            }
          >
            <div className="mt-auto flex items-center gap-3 pt-7">
              <GoogleMark />
              <span className="text-small text-ink-3">Google account</span>
            </div>
          </Card>

          <Card
            span={5}
            n="08"
            icon={UpdateCheckIcon}
            title="yt-dlp updates itself"
            body="It checks for a new version of yt-dlp on every launch, so downloads keep working when a site changes something."
            delay={80}
          />
        </div>
      </Container>
    </Section>
  );
}

/**
 * Every cell is the same object: icon, index, title, one line, one visual
 * pinned to the bottom. Uniform internal rhythm is what stops a bento grid
 * reading as a pile of unrelated widgets.
 */
function Card({ span, n, icon: Icon, title, body, delay, children }) {
  const cols = {
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    7: 'lg:col-span-7',
  }[span];

  return (
    <div
      data-reveal
      style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
      className={`panel panel-interactive flex flex-auto flex-col overflow-hidden p-6 sm:p-7 ${cols ?? ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="border-line-subtle flex size-9 items-center justify-center rounded-[var(--radius-control)] border bg-white/[0.025]">
          <Icon className="text-ink-2 size-4" strokeWidth={1.6} />
        </span>
        <span className="eyebrow">{n}</span>
      </div>

      <h3 className="text-card mt-5 font-medium">{title}</h3>
      <p className="text-body text-ink-2 mt-2.5 max-w-[44ch]">{body}</p>
      {children}
    </div>
  );
}

/** H.264 wins on a lit surface; the others are struck through and dimmed. */
function CodecRank() {
  const rows = [
    { codec: 'H.264', container: 'MP4', verdict: 'native · scrubs clean', win: true },
    { codec: 'VP9', container: 'WEBM', verdict: 'transcode first' },
    { codec: 'AV1', container: 'MP4', verdict: 'timeline stutters' },
  ];

  return (
    <div className="mt-auto space-y-1.5 pt-7">
      {rows.map((r, i) => (
        <div
          key={r.codec}
          className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3.5 py-2.5 ${
            r.win
              ? 'bg-white/[0.055] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.09),inset_0_0_0_1px_rgba(255,255,255,0.05)]'
              : 'border-line-subtle border'
          }`}
        >
          <span className="text-meta text-ink-4 w-4 font-[family-name:var(--font-geist-mono)]">
            {i + 1}
          </span>
          <span
            className={`text-small w-16 font-[family-name:var(--font-geist-mono)] font-medium ${
              r.win ? 'text-ink' : 'text-ink-3'
            }`}
          >
            {r.codec}
          </span>
          <span className="text-meta text-ink-4 hidden font-[family-name:var(--font-geist-mono)] sm:block">
            {r.container}
          </span>
          <span
            className={`text-small ml-auto ${r.win ? 'text-ink' : 'text-ink-4 line-through decoration-white/20'}`}
          >
            {r.verdict}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResolutionLadder() {
  const steps = ['4320p', '2160p', '1440p', '1080p', '720p'];

  return (
    <div className="mt-7">
      <div className="flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-geist-mono)] text-[44px] leading-none tracking-[-0.04em]">
          8K
        </span>
        <span className="text-small text-ink-4 font-[family-name:var(--font-geist-mono)]">
          7680 × 4320
        </span>
      </div>

      <div className="mt-5 flex items-end gap-1.5">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`rounded-[2px] ${i === 0 ? 'bg-ink' : 'bg-white/12'}`}
              style={{ height: 34 - i * 6 }}
            />
            <p
              className={`text-meta mt-2 text-center font-[family-name:var(--font-geist-mono)] ${
                i === 0 ? 'text-ink' : 'text-ink-4'
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The playlist view, mirroring the app: header with the playlist title and
 * its running count, Pause and Cancel top right, an overall bar, then one
 * row per video — done, downloading (with its own stats), queued.
 * Real videos, so every thumbnail matches its title — and every number is
 * derived from the real ones, not picked to look good. Titles, durations, top
 * qualities and byte sizes come from the videos themselves; the rest follows:
 *   in-flight  38.2% of 709 MB = 270.8 MB
 *   elapsed    270.8 / 10.42 MB/s = 00:26      left  438.2 / 10.42 = 00:42
 *   overall    (1120 + 270.8) / 4029 MB = 35%
 * Change a size and the four numbers below it have to move with it.
 */
function PlaylistQueue() {
  return (
    <div className="border-line-subtle mt-8 overflow-hidden rounded-[var(--radius-card)] border bg-black/40 p-4">
      {/* header */}
      <div className="flex items-center gap-3">
        <ChevronLeft className="text-ink-4 size-4 shrink-0" strokeWidth={2} />
        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-card truncate font-medium">Watch Later</p>
          <p className="text-meta text-ink-4 mt-1.5 font-[family-name:var(--font-geist-mono)] tracking-normal">
            1 of 3 videos completed
          </p>
        </div>
        <span className="text-small text-ink-2 hidden items-center gap-1.5 sm:flex">
          <Pause className="size-3" strokeWidth={2.4} />
          Pause
        </span>
        <span className="text-small flex items-center gap-1.5 rounded-[6px] bg-[#b3261e] px-3 py-1.5 font-medium text-white">
          <X className="size-3" strokeWidth={2.6} />
          Cancel
        </span>
      </div>

      {/* overall progress */}
      <div className="border-line-subtle mt-4 rounded-[8px] border bg-white/[0.02] px-3.5 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-small text-ink-2">Downloading 2 of 3</span>
          <span className="text-meta text-ink-3 font-[family-name:var(--font-geist-mono)]">37%</span>
        </div>
        <Bar pct={37} className="mt-2" />
      </div>

      {/* rows */}
      <div className="mt-4 space-y-1.5">
        <Row
          thumb="https://i.ytimg.com/vi/G4v1MITQbPk/maxresdefault.jpg"
          title="Take CSE Notes the Right Way | Handwritten, Digital & Coding Notes Explained"
          meta="1080p60 · 285 MB"
          dur="7:34"
          state="done"
        />
        <Row
          thumb="https://i.ytimg.com/vi/0lEWeVPD3nM/maxresdefault.jpg"
          title="My first 24-Hour Hackathon Experience | SST Buildverse 2025"
          meta="1080p60 · 420 MB"
          dur="12:45"
          state="active"
        />
        <Row
          thumb="https://i.ytimg.com/vi/ZsdgnZGbnzQ/maxresdefault.jpg"
          title="Building a Robot That Plays Soccer | SST College Fest Yugaantar Vlog ft. @Sankhokun & @chaiyeahhhh"
          meta="1080p60 · 510 MB"
          dur="16:33"
          state="queued"
        />
      </div>
    </div>
  );
}

function Row({ thumb, title, meta, dur, state }) {
  const active = state === 'active';

  return (
    <div
      className={`rounded-[10px] px-3 py-2.5 ${
        active ? 'border-line border bg-white/[0.03]' : '-mx-3 px-3'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="relative h-[30px] w-[53px] shrink-0 overflow-hidden rounded-[4px] bg-white/[0.07]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <span className="text-ink-2 absolute right-0.5 bottom-0.5 rounded-[2px] bg-black/75 px-1 font-[family-name:var(--font-geist-mono)] text-[8px] leading-[1.4]">
            {dur}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className={`text-small truncate ${state === 'done' ? 'text-ink-3' : 'text-ink'}`}>
            {title}
          </p>
          <p className="text-meta text-ink-4 mt-1 font-[family-name:var(--font-geist-mono)]">
            {meta}
          </p>
        </div>

        {state === 'done' ? (
          <span className="border-ok/60 flex size-[18px] shrink-0 items-center justify-center rounded-full border">
            <Check className="text-ok size-2.5" strokeWidth={3} />
          </span>
        ) : null}
        {state === 'queued' ? <span className="eyebrow shrink-0">Queued</span> : null}
        {active ? (
          <span className="text-small text-ink-3 flex shrink-0 items-center gap-1.5">
            <SkipForward className="size-3" strokeWidth={2.4} />
            Skip
          </span>
        ) : null}
      </div>

      {active ? (
        <>
          {/* the in-flight item carries its own speed / elapsed / remaining */}
          <div className="border-line-subtle mt-2.5 grid grid-cols-3 gap-2 rounded-[8px] border bg-white/[0.015] px-2 py-2.5 text-center">
            {[
              ['Speed', '10.42 MB/s'],
              ['Elapsed', '00:15'],
              ['Time left', '00:25'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-ink-4 font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.09em] uppercase">
                  {k}
                </p>
                <p className="text-small text-ink mt-1 font-[family-name:var(--font-geist-mono)] tabular-nums">
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div className="border-line-subtle mt-2 rounded-[8px] border bg-white/[0.015] px-3 py-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-small text-ink-2">Downloading…</span>
              <span className="text-meta text-ink-4 font-[family-name:var(--font-geist-mono)]">
                38.2% — 160.4 MB / 420 MB
              </span>
            </div>
            <Bar pct={38.2} className="mt-2" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Bar({ pct, className = '' }) {
  return (
    <div className={`h-1 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className="bg-ink h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Three columns on one centre line: the wire is the middle column's whole
 * height, so items-center puts it exactly level with the middle of both
 * boxes, and "ffmpeg" hangs above it rather than pushing it off centre.
 */
function ConvertStrip() {
  return (
    <div className="mt-7">
      <div className="border-line-subtle grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[var(--radius-control)] border bg-white/[0.015] p-4">
        <Box label="VP9" sub="in" />

        <div className="relative">
          <p className="text-meta text-ink-4 absolute inset-x-0 bottom-full mb-2 text-center font-[family-name:var(--font-geist-mono)]">
            ffmpeg
          </p>
          <div className="relative h-px w-full overflow-hidden bg-white/10">
            <span
              className="bg-ink absolute inset-y-0 left-0 w-1/3"
              style={{ animation: 'wire 2.4s var(--ease-out) infinite' }}
            />
          </div>
        </div>

        <Box label="H.264" sub="out" lit />
      </div>
    </div>
  );
}

function Box({ label, sub, lit }) {
  return (
    <div
      className={`min-w-[4.5rem] shrink-0 rounded-[4px] px-3 py-2 text-center ${
        lit
          ? 'bg-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'border-line border'
      }`}
    >
      <p
        className={`text-small font-[family-name:var(--font-geist-mono)] font-medium ${lit ? 'text-ink' : 'text-ink-3'}`}
      >
        {label}
      </p>
      <p className="text-meta text-ink-4 mt-0.5 font-[family-name:var(--font-geist-mono)]">{sub}</p>
    </div>
  );
}

/** Google's four-colour mark. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-6 shrink-0" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

