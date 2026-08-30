'use client';

import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { ArrowLeft, ChevronDown, Pause, Search, Download } from 'lucide-react';
import { Container, Section } from './ui';
import { GitHubIcon } from './icons';

const URL_TEXT = 'https://youtu.be/LXb3EKWsInQ?si=D1xP5yIw-M_CR_PD';
const TOTAL_GB = 1.06;
const SPEED = 6.22; // MB/s

const phase = (p, from, to) => Math.min(1, Math.max(0, (p - from) / (to - from)));

const mmss = (s) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/**
 * The middle beat of the page: a URL gets typed, a real download runs, and it
 * finishes — all driven by scroll position, so the story advances at the
 * reader's pace rather than on a timer.
 *
 * The timing is deliberately eager. Progress is measured from the moment the
 * panel starts entering the viewport, not from when it is centred, so the
 * typing is already under way as you arrive and the details view is populated
 * by the time the window is fully on screen. Waiting until it is centred
 * makes the whole thing feel like it is lagging behind you.
 */
export function DownloadFlow() {
  const ref = useRef(null);

  // Two trackers, because the two things being driven live in different
  // windows and deriving one from the other means redoing the arithmetic
  // every time the section height changes.
  //
  //   lead  — section top crossing the viewport, up to the moment it pins.
  //           Typing runs here, so the URL is finished as the panel lands.
  //   pinned — exactly the span the sticky panel is held for. The download
  //           runs here, so it cannot possibly still be going when the panel
  //           lets go and the page moves on.
  const { scrollYProgress: lead } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  });
  const { scrollYProgress: pinned } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const [pct, setPct] = useState(0);
  const [typed, setTyped] = useState(0);

  // Rounded before it reaches state, so this re-renders ~100 times across the
  // whole scroll instead of once per frame.
  useMotionValueEvent(lead, 'change', (p) => {
    const chars = Math.round(phase(p, 0.25, 0.92) * URL_TEXT.length);
    setTyped((prev) => (prev === chars ? prev : chars));
  });

  // Spans the whole pinned window bar a short tail, so there is no stretch of
  // scrolling that moves nothing — that reads as the page having scrolled.
  useMotionValueEvent(pinned, 'change', (p) => {
    const next = Math.round(phase(p, 0, 0.92) * 100);
    setPct((prev) => (prev === next ? prev : next));
  });

  const started = typed >= URL_TEXT.length;
  const done = pct >= 100;
  const totalMb = TOTAL_GB * 1024;
  const totalSecs = totalMb / SPEED;
  const elapsed = (pct / 100) * totalSecs;

  // Switch to GB past 1024 MB. Holding MB all the way up prints
  // "1085.44 MB / 1.06 GB", which reads as an overflow even though it is the
  // same number.
  const doneMb = (pct / 100) * totalMb;
  const got = doneMb >= 1024 ? `${(doneMb / 1024).toFixed(2)} GB` : `${doneMb.toFixed(1)} MB`;

  return (
    <Section className="relative !py-0">
      <div ref={ref} className="relative h-[170vh]">
        {/* Centred in the region BELOW the fixed nav — centring against the
            raw viewport shoves the panel up under the bar. */}
        <div
          className="sticky top-0 flex min-h-svh items-center"
          style={{ paddingTop: 'calc(var(--nav-h) + 1.25rem)', paddingBottom: '1.25rem' }}
        >
          <Container>
            <div className="dlf-window">
              {/* ——— url bar ——— */}
              <div className="dlf-bar">
                <div className="dlf-input">
                  <span className="dlf-url">
                    {typed > 0 ? (
                      URL_TEXT.slice(0, typed)
                    ) : (
                      <span className="dlf-placeholder">Paste a YouTube URL…</span>
                    )}
                    {!started ? <span className="dlf-caret" /> : null}
                  </span>
                </div>
                <span className="dlf-get" data-live={started ? 'on' : 'off'}>
                  <Search className="size-[1.05em] shrink-0" strokeWidth={2.2} />
                  Get Video
                </span>
                <span className="dlf-icon">
                  <Download className="size-[1.15em]" strokeWidth={1.9} />
                  <span className="dlf-dot" data-on={pct > 0 ? 'on' : 'off'} />
                </span>
                <span className="dlf-icon">
                  <GitHubIcon className="size-[1.15em]" />
                </span>
              </div>

              {/* ——— details view ——— */}
              <div className="dlf-body" data-ready={started ? 'on' : 'off'}>
                <p className="dlf-back">
                  <ArrowLeft className="size-[1em]" strokeWidth={2} />
                  Back
                </p>

                <div className="dlf-grid">
                  <div className="dlf-left">
                    <div className="dlf-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/costa-rica.jpg"
                        alt=""
                        className="dlf-thumb-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="dlf-selects">
                      <span className="dlf-select">
                        MP4 (Video)
                        <ChevronDown className="size-[1.05em] shrink-0" strokeWidth={2} />
                      </span>
                      <span className="dlf-select">
                        2160p60
                        <ChevronDown className="size-[1.05em] shrink-0" strokeWidth={2} />
                      </span>
                    </div>

                    <span className="dlf-btn">
                      <Pause className="size-[1.05em]" strokeWidth={2.2} />
                      Pause
                    </span>
                    <span className="dlf-btn dlf-btn-cancel">Cancel</span>

                    <div className="dlf-stats">
                      <div>
                        <p className="dlf-stat-k">Speed</p>
                        <p className="dlf-stat-v">{done ? '—' : `${SPEED.toFixed(2)} MB/s`}</p>
                      </div>
                      <div>
                        <p className="dlf-stat-k">Elapsed</p>
                        <p className="dlf-stat-v">{mmss(elapsed)}</p>
                      </div>
                      <div>
                        <p className="dlf-stat-k">Time left</p>
                        <p className="dlf-stat-v">{done ? '00:00' : mmss(totalSecs - elapsed)}</p>
                      </div>
                    </div>

                    <div className="dlf-prog">
                      <div className="dlf-prog-head">
                        <span>{done ? 'Download complete' : 'Downloading video…'}</span>
                        <span className="dlf-prog-num">
                          {pct.toFixed(1)}% — {got} / {TOTAL_GB} GB
                        </span>
                      </div>
                      <div className="dlf-track">
                        <div
                          className="dlf-fill"
                          data-done={done ? 'on' : 'off'}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="dlf-right">
                    <p className="dlf-title">COSTA RICA IN 4K 60fps HDR (ULTRA HD)</p>
                    <div className="dlf-desc">
                      <p>
                        Sigma 150-500mm
                        <br />
                        Zeiss Classic 15mm
                        <br />
                        MOVI M10
                        <br />
                        Adobe Premiere and DaVinci Resolve
                      </p>
                      <p>
                        LICENSING &amp; BUSINESS INQUIRIES
                        <br />▶ contact@mysterybox.us
                      </p>
                      <p>
                        This video is subject to copyright owned by Mystery Box LLC. Any
                        reproduction or republication of all or part of this video is expressly
                        prohibited, unless Mystery Box has explicitly granted its prior written
                        consent. All other rights reserved.
                      </p>
                      <p>Copyright © 2017 Mystery Box, LLC. All Rights Reserved.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </Section>
  );
}
