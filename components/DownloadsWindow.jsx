import {
  Search,
  Download,
  Coffee,
  Settings,
  Trash2,
  Info,
  LoaderCircle,
  Clock,
  Pause,
  ArrowRight,
  X,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/*
  The Downloads window, built out of real elements instead of a screenshot.

  A PNG could not reflow, could not follow the theme and shipped a fixed
  1598px of pixels to a 360px phone. This is the same window as markup, so it
  scales with its column and rearranges when the column gets narrow.

  Sizing is one knob: `.dw` takes a font-size off the CONTAINER's width (not
  the viewport — the window lives in a grid column, so cqw is the only unit
  that tracks it) and every measurement inside is in `em`. Change that one
  clamp and the whole window scales as a unit.

  Every video is real, and so is every number: titles, durations and byte
  sizes come from the videos themselves, and the top quality shown is the
  best format each one actually publishes.
*/

const QUEUE = [
  {
    thumb: '/thumb-blackclover.jpg',
    title: 'Asta is BACK! ⚔️| Black Clover Second Season: Official Trailer | Crunchyroll India',
    meta: 'Queued · ~31.99 MB',
  },
  {
    thumb: '/thumb-doomsday.jpg',
    title: 'Avengers: Doomsday | Official Trailer | In Theaters December 18',
    meta: 'Queued · ~114.95 MB',
  },
];

/* The rule runs from the label to the far edge, so the two groups read as
   bands across the window rather than as headings sitting above lists. */
function GroupLabel({ children, info = false }) {
  return (
    <div className="dw-group">
      <span className="dw-group-k">{children}</span>
      {info ? <Info className="dw-group-i" strokeWidth={1.9} /> : null}
      <span className="dw-group-rule" />
    </div>
  );
}

function Thumb({ src }) {
  return (
    <span className="dw-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="dw-thumb-img" loading="lazy" decoding="async" />
    </span>
  );
}

export function DownloadsWindow() {
  return (
    <div className="dw-wrap">
      <div className="dw">
        {/* ——— url bar ——— */}
        <div className="dw-top">
          <div className="dw-url">
            <span className="dw-url-ph">Paste a video URL…</span>
            <span className="dw-kbd">/</span>
          </div>
          <span className="dw-get">
            <Search className="dw-i" strokeWidth={2.2} />
            <span className="dw-get-t">Get Video</span>
          </span>
          <span className="dw-tab">
            <Download className="dw-i-lg" strokeWidth={1.9} />
            <span className="dw-tab-dot" />
          </span>
          <span className="dw-tab">
            <span className="dw-mark" />
          </span>
        </div>

        {/* ——— downloads panel ——— */}
        <div className="dw-panel">
          <div className="dw-head">
            <p className="dw-h1">Downloads</p>
            <div className="dw-acts">
              <span className="dw-act">
                <Coffee className="dw-i-lg" strokeWidth={1.8} />
                <span className="dw-act-t">Buy me a coffee</span>
              </span>
              <span className="dw-act">
                <Settings className="dw-i-lg" strokeWidth={1.8} />
                <span className="dw-act-t">Settings</span>
              </span>
              <span className="dw-act">
                <Trash2 className="dw-i-lg" strokeWidth={1.8} />
                <span className="dw-act-t">Clear</span>
              </span>
            </div>
          </div>

          <GroupLabel info>In progress</GroupLabel>

          {/* the one in flight: its own progress bar and a pause it can take */}
          <div className="dw-row dw-row-card">
            <Thumb src="/thumb-fold8.jpg" />
            <div className="dw-body">
              <p className="dw-title">All-new Unfolds | Galaxy Z Fold8 Ultra and Fold8 | Samsung</p>
              <p className="dw-meta">
                <LoaderCircle className="dw-i" strokeWidth={2} />
                13% · 2.47 MB/s
              </p>
              <span className="dw-bar">
                <span className="dw-bar-fill" style={{ width: '13%' }} />
              </span>
            </div>
            <div className="dw-tools">
              <Pause className="dw-tool" strokeWidth={1.9} />
              <ArrowRight className="dw-tool" strokeWidth={1.9} />
              <X className="dw-tool" strokeWidth={1.9} />
            </div>
          </div>

          {QUEUE.map((q) => (
            <div key={q.thumb} className="dw-row dw-row-card">
              <Thumb src={q.thumb} />
              <div className="dw-body">
                <p className="dw-title">{q.title}</p>
                <p className="dw-meta">
                  <Clock className="dw-i" strokeWidth={2} />
                  {q.meta}
                </p>
              </div>
              <div className="dw-tools">
                <ArrowRight className="dw-tool" strokeWidth={1.9} />
                <X className="dw-tool" strokeWidth={1.9} />
              </div>
            </div>
          ))}

          <GroupLabel>History</GroupLabel>

          {/* Finished rows trade the progress bar for what was actually
              written to disk, and Pause/Skip for Reveal in Folder. */}
          <div className="dw-row">
            <Thumb src="/thumb-ae.jpg" />
            <div className="dw-body">
              <p className="dw-title">
                The Best Click Visual Effects Used in SaaS Videos | After Effects Tutorial
              </p>
              <p className="dw-meta dw-meta-mono">1080p60 (VP9 → H.264) (MP4)</p>
            </div>
            <div className="dw-tools">
              <FolderOpen className="dw-tool" strokeWidth={1.9} />
              <X className="dw-tool" strokeWidth={1.9} />
            </div>
          </div>

          <div className="dw-foot">
            <span className="dw-count">1–15 of 171</span>
            <div className="dw-pager">
              <span className="dw-page dw-page-nav" data-off="on">
                <ChevronLeft className="dw-i" strokeWidth={2.2} />
              </span>
              <span className="dw-page" data-on="on">
                1
              </span>
              <span className="dw-page">2</span>
              <span className="dw-page dw-page-gap">…</span>
              <span className="dw-page">12</span>
              <span className="dw-page dw-page-nav">
                <ChevronRight className="dw-i" strokeWidth={2.2} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
