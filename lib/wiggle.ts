import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Hover wiggle: loops a stepped rotation on `[data-wiggle-target]` (or the
 * element itself) while the pointer is over it. Returns a cleanup.
 * Pure decoration, so it's a no-op for reduced-motion users.
 */
export function initWiggle(element: Element, intensity: number): () => void {
  if (prefersReducedMotion()) return () => {};
  const target = element.querySelector("[data-wiggle-target]") ?? element;
  gsap.set(target, { transformOrigin: "center center" });
  let tween: gsap.core.Tween | undefined;
  const onEnter = () => {
    tween = gsap.to(target, { rotation: intensity, duration: 0.17, repeat: -1, yoyo: true, ease: "steps(1)" });
  };
  const onLeave = () => {
    if (!tween) return;
    tween.kill();
    gsap.to(target, { rotation: 0, duration: 0.3, ease: "power2.out" });
  };
  element.addEventListener("mouseenter", onEnter);
  element.addEventListener("mouseleave", onLeave);
  return () => {
    element.removeEventListener("mouseenter", onEnter);
    element.removeEventListener("mouseleave", onLeave);
  };
}
