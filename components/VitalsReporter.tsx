"use client";

import { useEffect } from "react";
import type { InpBucket, InpSample, InpTarget } from "@/lib/vitals";

/*
 * Field INP, measured on real visits and sent to /api/vitals.
 *
 * - Page INP comes from web-vitals (with attribution), reported once the page
 *   is hidden, which is when the final value is known.
 * - Controls tagged data-inp="search" / "cart-stepper" are measured per
 *   interaction from Event Timing entries: one sample per interaction, the
 *   longest event in it, which is how INP itself counts.
 *
 * Everything is batched and sent with sendBeacon on pagehide / hidden, so it
 * never competes with the interactions it's measuring.
 */
export default function VitalsReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof PerformanceObserver === "undefined") return;

    const queue: InpSample[] = [];
    const device: InpSample["device"] = window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
    const base = () => ({ path: location.pathname, device, at: Date.now() });

    // Tagged controls: longest event per interaction, queued once it settles.
    const pending = new Map<number, { bucket: InpTarget; value: number }>();
    const drainPending = () => {
      for (const { bucket, value } of pending.values()) queue.push({ bucket, value: Math.round(value), ...base() });
      pending.clear();
    };

    const flush = () => {
      drainPending();
      if (queue.length === 0) return;
      const body = JSON.stringify(queue.splice(0, queue.length));
      if (!navigator.sendBeacon?.("/api/vitals", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/vitals", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    };

    let timer = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        const id = entry.interactionId;
        if (!id) continue;
        const el = entry.target instanceof Element ? entry.target.closest("[data-inp]") : null;
        const bucket = el?.getAttribute("data-inp") as InpTarget | null;
        if (bucket !== "search" && bucket !== "cart-stepper") continue;
        const prev = pending.get(id);
        if (!prev || entry.duration > prev.value) pending.set(id, { bucket, value: entry.duration });
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(drainPending, 1000);
    });
    try {
      observer.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {
      /* Event Timing not supported (Safari): page INP below still works where it can */
    }

    // Page INP (the Core Web Vital).
    let cancelled = false;
    void import("web-vitals/attribution").then(({ onINP }) => {
      if (cancelled) return;
      onINP((metric) => {
        const a = metric.attribution;
        queue.push({
          bucket: "page" satisfies InpBucket,
          value: Math.round(metric.value),
          inputDelay: Math.round(a.inputDelay),
          processing: Math.round(a.processingDuration),
          presentation: Math.round(a.presentationDelay),
          target: a.interactionTarget?.slice(0, 200),
          ...base(),
        });
        flush();
      });
    });

    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", flush);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
