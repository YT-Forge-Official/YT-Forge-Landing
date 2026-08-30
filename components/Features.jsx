import {
  Film,
  Maximize2,
  ListVideo,
  RefreshCw,
  Zap,
  KeyRound,
  ArrowUp,
  ChevronLeft,
  Pause,
  X,
  SkipForward,
  Check,
} from 'lucide-react';
import { Container, Section, SectionHead } from './ui';

export function Features() {
  return (
    <Section id="features" beat="chapter">
      <Container>
        <SectionHead eyebrow="Features" title="Built with editors in mind." />

        <div className="mt-14 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <Card
            span={7}
            n="01"
            icon={Film}
            title="H.264 + AAC, picked for you"
            body="YouTube serves the same video in three codecs. You get the one that scrubs."
          >
            <CodecRank />
          </Card>

          <Card
            span={5}
            n="02"
            icon={Maximize2}
            title="Up to 8K"
            body="If the source has it, you can pull it."
            delay={80}
          >
            <ResolutionLadder />
          </Card>

          <Card
            span={5}
            n="03"
            icon={ListVideo}
            title="Playlists, queued"
            body="Paste a playlist, pick a folder, walk away."
          >
            <PlaylistQueue />
          </Card>

          <Card
            span={4}
            n="04"
            icon={RefreshCw}
            title="Convert on the fly"
            body="Re-encode VP9 or AV1 to H.264 in the app."
            delay={80}
          >
            <ConvertStrip />
          </Card>

          <Card
            span={3}
            n="05"
            icon={Zap}
            title="Fast"
            body="Parallel chunks, not one thin stream."
            delay={160}
          >
            <ChunkLanes />
          </Card>

          <Card
            span={7}
            n="06"
            icon={KeyRound}
            title="Sign in with Google"
            body="Members-only, age-gated and purchased videos need your account. Sign in and YT-FORGE pulls what you already have access to."
          >
            <SignInRow />
          </Card>

          <Card
            span={5}
            n="07"
            icon={ArrowUp}
            title="Always current"
            body="yt-dlp updates itself on launch, so downloads keep working when YouTube changes."
            delay={80}
          >
            <EngineRow />
          </Card>
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
      className={`panel panel-interactive flex flex-col overflow-hidden p-6 sm:p-7 ${cols}`}
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
    <div className="mt-auto pt-7">
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
 * The playlist view as it actually appears in the app: a header with the
 * playlist title and its completed count, an overall bar, then one row per
 * video — done, downloading, queued.
 */
function PlaylistQueue() {
  return (
    <div className="border-line-subtle mt-auto overflow-hidden rounded-[var(--radius-card)] border bg-black/40 pt-3.5 pb-1">
      {/* header */}
      <div className="flex items-center gap-2.5 px-3.5">
        <ChevronLeft className="text-ink-4 size-3.5 shrink-0" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="text-small truncate font-medium">Maximum Likelihood</p>
          <p className="text-meta text-ink-4 mt-1 font-[family-name:var(--font-geist-mono)] tracking-normal">
            1 of 6 videos completed
          </p>
        </div>
        <span className="text-meta text-ink-3 hidden items-center gap-1 sm:flex">
          <Pause className="size-2.5" strokeWidth={2.4} />
          Pause
        </span>
        <span className="text-meta flex items-center gap-1 rounded-[4px] bg-[#b3261e] px-1.5 py-1 text-white">
          <X className="size-2.5" strokeWidth={2.6} />
          Cancel
        </span>
      </div>

      {/* overall progress */}
      <div className="border-line-subtle mx-3.5 mt-3.5 rounded-[8px] border bg-white/[0.02] px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-meta text-ink-2 tracking-normal">Downloading 2 of 6</span>
          <span className="text-meta text-ink-3 font-[family-name:var(--font-geist-mono)]">26%</span>
        </div>
        <Bar pct={26} className="mt-2" />
      </div>

      {/* rows */}
      <div className="mt-1.5 space-y-1 px-2 pb-2">
        <Row title="Likelihood vs Probability" meta="720p · 803.06 KB" dur="0:30" state="done" />
        <Row
          title="Maximum Likelihood For the Normal Distribution"
          meta="720p · 25.58 MB"
          dur="19:50"
          state="active"
        />
        <Row
          title="Maximum Likelihood for the Binomial Distribution"
          meta="720p60 · 19 MB"
          dur="11:24"
          state="queued"
        />
      </div>
    </div>
  );
}

function Row({ title, meta, dur, state }) {
  const active = state === 'active';

  return (
    <div
      className={`rounded-[8px] px-2.5 py-2 ${
        active ? 'border-line border bg-white/[0.03]' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative h-[26px] w-[46px] shrink-0 overflow-hidden rounded-[4px] bg-white/[0.07]">
          <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),transparent_60%)]" />
          <span className="text-ink-2 absolute right-0.5 bottom-0.5 rounded-[2px] bg-black/75 px-1 font-[family-name:var(--font-geist-mono)] text-[8px] leading-[1.4]">
            {dur}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className={`text-small truncate ${state === 'done' ? 'text-ink-3' : 'text-ink'}`}>
            {title}
          </p>
          <p className="text-meta text-ink-4 mt-0.5 font-[family-name:var(--font-geist-mono)]">
            {meta}
          </p>
        </div>

        {state === 'done' ? (
          <span className="border-ok/60 flex size-4 shrink-0 items-center justify-center rounded-full border">
            <Check className="text-ok size-2.5" strokeWidth={3} />
          </span>
        ) : null}
        {state === 'queued' ? <span className="eyebrow shrink-0">Queued</span> : null}
      </div>

      {active ? (
        <>
          <div className="border-line-subtle mt-2 rounded-[6px] border bg-white/[0.02] px-2.5 py-2">
            <div className="flex items-baseline justify-between">
              <span className="text-meta text-ink-2 tracking-normal">Downloading…</span>
              <span className="text-meta text-ink-4 font-[family-name:var(--font-geist-mono)]">
                55.4%
              </span>
            </div>
            <Bar pct={55.4} className="mt-1.5" />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-meta text-ink-4 font-[family-name:var(--font-geist-mono)]">
              10.42 MB/s
            </span>
            <span className="text-meta text-ink-3 flex items-center gap-1">
              <SkipForward className="size-2.5" strokeWidth={2.4} />
              Skip
            </span>
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

function ConvertStrip() {
  return (
    <div className="border-line-subtle mt-auto flex items-center gap-3 rounded-[var(--radius-control)] border bg-white/[0.015] p-3.5">
      <Box label="VP9" sub="in" />
      <div className="flex-1">
        <p className="text-meta text-ink-4 mb-2 text-center font-[family-name:var(--font-geist-mono)]">
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
  );
}

function Box({ label, sub, lit }) {
  return (
    <div
      className={`shrink-0 rounded-[4px] px-3 py-2 text-center ${
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

/** Four lanes at four fills — one stream would be one lane. */
function ChunkLanes() {
  const lanes = [100, 88, 71, 54];

  return (
    <div className="mt-auto pt-7">
      <div className="space-y-2">
        {lanes.map((pct, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-meta text-ink-4 w-3 font-[family-name:var(--font-geist-mono)]">
              {i + 1}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="bg-ink/85 h-full rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-meta text-ink-4 mt-4 font-[family-name:var(--font-geist-mono)]">
        4 chunks · one file
      </p>
    </div>
  );
}

function SignInRow() {
  return (
    <div className="mt-auto flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between">
      <span className="border-line-strong inline-flex h-10 shrink-0 items-center gap-2.5 self-start rounded-[var(--radius-control)] border bg-white/[0.03] px-4">
        <span className="bg-ink text-bg flex size-4 items-center justify-center rounded-full font-[family-name:var(--font-geist-mono)] text-[10px] font-semibold">
          G
        </span>
        <span className="text-small font-medium">Continue with Google</span>
      </span>

      <div className="flex flex-wrap gap-1.5">
        {['Members-only', 'Age-restricted', 'Purchased'].map((t) => (
          <span
            key={t}
            className="text-meta text-ink-3 border-line-subtle rounded-[var(--radius-pill)] border px-2.5 py-1 font-[family-name:var(--font-geist-mono)]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function EngineRow() {
  return (
    <div className="border-line-subtle mt-auto flex items-center gap-4 rounded-[var(--radius-control)] border bg-white/[0.015] px-4 py-3.5">
      <span className="text-small text-ink font-[family-name:var(--font-geist-mono)]">yt-dlp</span>
      <span className="bg-line-subtle h-4 w-px" />
      <span className="text-small text-ink-3 font-[family-name:var(--font-geist-mono)]">ffmpeg</span>
      <span className="text-meta text-ink-4 ml-auto flex items-center gap-1.5 font-[family-name:var(--font-geist-mono)]">
        <ArrowUp className="size-3" strokeWidth={2.4} />
        Checked on launch
      </span>
    </div>
  );
}
