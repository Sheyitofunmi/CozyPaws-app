import type Lenis from "lenis";

declare global {
  interface Window {
    /** The homepage's Lenis instance (set by SmoothScroll), for jump-to-top. */
    __lenis?: Lenis;
  }
}

export {};
