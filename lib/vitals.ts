/*
 * Field INP samples, shared by the browser reporter and the /api/vitals route.
 *
 * Two kinds of sample:
 *  - "page": the page's INP from the web-vitals library (the Core Web Vital),
 *    with attribution for where the time went.
 *  - a tagged control ("search", "cart-stepper"): every interaction with an
 *    element marked data-inp="…", measured from Event Timing entries, so we
 *    know how those specific controls feel, not just the page's worst moment.
 */
export const INP_TARGETS = ["search", "cart-stepper"] as const;
export type InpTarget = (typeof INP_TARGETS)[number];
export type InpBucket = "page" | InpTarget;

export interface InpSample {
  bucket: InpBucket;
  /** Interaction latency in ms. */
  value: number;
  /** Where the time went (page samples only). */
  inputDelay?: number;
  processing?: number;
  presentation?: number;
  target?: string;
  path: string;
  device: "mobile" | "desktop";
  at: number;
}

export const INP_GOOD_MS = 200;
export const INP_POOR_MS = 500;

export function isInpSample(v: unknown): v is InpSample {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  const num = (x: unknown) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < 60_000;
  return (
    (s.bucket === "page" || INP_TARGETS.includes(s.bucket as InpTarget)) &&
    num(s.value) &&
    typeof s.path === "string" &&
    s.path.length < 200 &&
    (s.device === "mobile" || s.device === "desktop") &&
    [s.inputDelay, s.processing, s.presentation].every((x) => x === undefined || num(x)) &&
    (s.target === undefined || (typeof s.target === "string" && s.target.length < 300))
  );
}

/** Nearest-rank percentile of a list of numbers (p in 0..100). */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))]!;
}

export function rate(value: number): "good" | "needs-improvement" | "poor" {
  if (value <= INP_GOOD_MS) return "good";
  return value <= INP_POOR_MS ? "needs-improvement" : "poor";
}
