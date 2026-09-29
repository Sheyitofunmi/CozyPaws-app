"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";
import type { HeroClip } from "@/lib/hero-reel";

/*
 * Plays a list of short clips back to back with a crossfade, using two
 * <video> elements: one is on screen, the other quietly loads the next clip.
 *
 * - Autoplays (muted, inline) only when the hero is on screen, and pauses when
 *   it scrolls away or the tab is hidden, so nothing decodes off screen.
 * - Reduced motion or Save-Data: nothing downloads until the visitor presses
 *   play; the illustrated scene underneath stays as the hero.
 * - A clip that fails to load is skipped; if every clip fails, the scene stays.
 * - Progress is written to a CSS variable from rAF (no React re-render per frame).
 */
/** H.264 is hardware-decoded almost everywhere; VP9 covers browsers built without it. */
function pickFormat(v: HTMLVideoElement): "mp4" | "webm" {
  if (v.canPlayType('video/mp4; codecs="avc1.640028"')) return "mp4";
  return v.canPlayType('video/webm; codecs="vp9"') ? "webm" : "mp4";
}

export function useHeroReel(clips: HeroClip[], rootRef: RefObject<HTMLElement | null>) {
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLOListElement>(null);

  const [index, setIndex] = useState(0);
  const [slot, setSlot] = useState<0 | 1>(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Mutable mirror of the state for event handlers.
  const s = useRef({ index: 0, slot: 0 as 0 | 1, want: false, inView: false, failures: 0 });

  const el = (which: 0 | 1) => (which === 0 ? videoA.current : videoB.current);

  const load = useCallback(
    (v: HTMLVideoElement, i: number) => {
      const clip = clips[i];
      if (!clip || v.dataset.clip === String(i)) return;
      v.dataset.clip = String(i);
      v.src = `${clip.src}.${pickFormat(v)}`;
      v.load();
    },
    [clips],
  );

  const show = useCallback(
    (i: number, to: 0 | 1) => {
      const v = el(to);
      if (!v) return;
      const from = s.current.slot;
      load(v, i);
      if (v.currentTime > 0) v.currentTime = 0;
      s.current.index = i;
      s.current.slot = to;
      setIndex(i);
      setSlot(to);
      v.play().catch(() => {
        // Autoplay refused (e.g. Low Power Mode): wait for a tap on play.
        s.current.want = false;
        setPlaying(false);
      });
      // Let the outgoing clip fade, then stop it and queue the one after.
      if (from !== to) {
        window.setTimeout(() => {
          const old = el(from);
          if (!old || s.current.slot === from) return;
          old.pause();
          load(old, (i + 1) % clips.length);
        }, 900);
      } else {
        const other = el(to === 0 ? 1 : 0);
        if (other) load(other, (i + 1) % clips.length);
      }
    },
    [clips.length, load],
  );

  const advance = useCallback(() => {
    const { index: i, slot: at } = s.current;
    show((i + 1) % clips.length, at === 0 ? 1 : 0);
  }, [clips.length, show]);

  const start = useCallback(() => {
    s.current.want = true;
    setPlaying(true);
    const v = el(s.current.slot);
    if (!v) return;
    if (!v.dataset.clip) show(s.current.index, s.current.slot);
    else v.play().catch(() => setPlaying(false));
  }, [show]);

  const stop = useCallback(() => {
    s.current.want = false;
    setPlaying(false);
    el(s.current.slot)?.pause();
  }, []);

  const toggle = useCallback(() => (s.current.want ? stop() : start()), [start, stop]);

  const goTo = useCallback(
    (i: number) => {
      s.current.want = true;
      setPlaying(true);
      if (i === s.current.index && el(s.current.slot)?.dataset.clip) {
        const v = el(s.current.slot)!;
        v.currentTime = 0;
        v.play().catch(() => setPlaying(false));
        return;
      }
      const to: 0 | 1 = s.current.slot === 0 ? 1 : 0;
      show(i, el(s.current.slot)?.dataset.clip ? to : s.current.slot);
    },
    [show],
  );

  // Video events: fade in on the first real frame, advance on end, skip broken clips.
  useEffect(() => {
    const pair = [videoA.current, videoB.current];
    const offs: Array<() => void> = [];
    pair.forEach((v, which) => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      const isActive = () => s.current.slot === which;
      const onPlaying = () => {
        if (!isActive()) return;
        s.current.failures = 0;
        setStarted(true);
      };
      const onEnded = () => isActive() && advance();
      const onError = () => {
        if (!isActive() || !v.dataset.clip) return;
        s.current.failures += 1;
        if (s.current.failures >= clips.length) {
          setStarted(false);
          stop();
          return;
        }
        advance();
      };
      v.addEventListener("playing", onPlaying);
      v.addEventListener("ended", onEnded);
      v.addEventListener("error", onError);
      offs.push(() => {
        v.removeEventListener("playing", onPlaying);
        v.removeEventListener("ended", onEnded);
        v.removeEventListener("error", onError);
      });
    });
    return () => offs.forEach((off) => off());
  }, [advance, stop, clips.length]);

  // Autoplay when visible (unless reduced motion / Save-Data), pause when not.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    if (!reduce && !saveData) {
      s.current.want = true;
      setPlaying(true);
    }

    const sync = () => {
      const v = el(s.current.slot);
      const shouldRun = s.current.want && s.current.inView && !document.hidden;
      if (shouldRun) {
        if (!v?.dataset.clip) show(s.current.index, s.current.slot);
        else if (v.paused) v.play().catch(() => {});
      } else if (v && !v.paused) {
        v.pause();
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        s.current.inView = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0.25 },
    );
    io.observe(root);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [rootRef, show]);

  // Progress bar for the current clip.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = el(s.current.slot);
      const bar = progressRef.current;
      if (v && bar && v.duration) bar.style.setProperty("--reel-progress", String(v.currentTime / v.duration));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return { videoA, videoB, progressRef, index, slot, started, playing, toggle, goTo };
}
