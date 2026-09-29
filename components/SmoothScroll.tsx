"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

/** Lenis smooth scrolling driven by GSAP's ticker, plus the "come back" tab title. */
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Don't re-run every ScrollTrigger refresh when the mobile URL bar
    // shows/hides: that "resize" made pinned sections jump mid-scroll.
    ScrollTrigger.config({ ignoreMobileResize: true });

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;
    if (!prefersReducedMotion()) {
      const instance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // 1 = native touch speed; amplifying it made phone/tablet
        // scrolling feel slippery and out of sync with the finger.
        touchMultiplier: 1,
      });
      instance.on("scroll", ScrollTrigger.update);
      tick = (time) => instance.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      window.__lenis = instance;
      lenis = instance;
    }

    const originalTitle = document.title;
    const handleVisibility = () => {
      document.title = document.hidden ? "Hey, come back! 🐾 - CozyPaws" : originalTitle;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (tick) {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33); // GSAP's default again for other pages
      }
      lenis?.destroy();
      document.removeEventListener("visibilitychange", handleVisibility);
      document.title = originalTitle;
      delete window.__lenis;
    };
  }, []);

  return null;
}
