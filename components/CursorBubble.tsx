"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useHomeSections } from "@/lib/home-sections";

/** Things the bubble says "click" (or "to home") over. */
const CLICKABLE =
  ".footer-column h3, .footer-map-link span, .footer-email, .footer-whatsapp, .single-social, .cozy-logo, .nav-work-btn";

/** A little "click" speech bubble that follows the mouse over clickable decoration. */
export default function CursorBubble() {
  const sections = useHomeSections();
  const localRef = useRef<HTMLDivElement>(null);
  const bubbleRef = sections?.cursorBubble ?? localRef;

  useEffect(() => {
    // Only for a fine pointer (mouse) and users who are fine with motion.
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
      const bubble = bubbleRef.current;
      if (!bubble) return;

      const xTo = gsap.quickTo(bubble, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(bubble, "y", { duration: 0.5, ease: "power3" });
      let over = false;
      gsap.set(bubble, { rotation: -30 });

      const show = (label: string) => {
        over = true;
        bubble.textContent = label;
        gsap.killTweensOf(bubble, "opacity,scale,rotation");
        gsap.to(bubble, { opacity: 1, scale: 1, rotation: 0, duration: 1.7, delay: 0.1, ease: "elastic.out(1, 0.4)" });
      };
      const hide = () => {
        over = false;
        gsap.killTweensOf(bubble, "opacity,scale,rotation");
        gsap.to(bubble, { opacity: 1, scale: 0, rotation: -30, duration: 0.3, ease: "sine.inOut" });
      };

      const onMouseMove = (e: MouseEvent) => {
        xTo(e.clientX + 13);
        yTo(e.clientY - 43);
      };
      const onMouseOver = (e: MouseEvent) => {
        const found = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
        if (found && !over) show(found.matches(".cozy-logo") ? "to home" : "click");
        else if (!found && over) hide();
      };
      const onMouseLeave = () => {
        if (over) hide();
      };

      window.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseover", onMouseOver);
      document.addEventListener("mouseleave", onMouseLeave);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseover", onMouseOver);
        document.removeEventListener("mouseleave", onMouseLeave);
      };
    });
    return () => mm.revert();
  }, [bubbleRef]);

  return (
    <div ref={bubbleRef} className="cursor-bubble" aria-hidden="true">
      click
    </div>
  );
}
