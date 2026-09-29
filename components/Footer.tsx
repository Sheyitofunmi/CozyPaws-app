"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { initWiggle } from "@/lib/wiggle";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SOCIAL_ICONS, WIGGLE_CONFIG } from "@/lib/data";
import { useIdleReady } from "@/lib/hooks/useIdleReady";

type WiggleKey = keyof typeof WIGGLE_CONFIG;

/** Hover wiggles, by selector (scoped to the footer) and intensity. */
const WIGGLE_TARGETS: { selector: string; key: WiggleKey }[] = [
  { selector: ".footer-column:first-child h3", key: "jobHeading" },
  { selector: ".footer-map-link span", key: "googleMap" },
  { selector: ".footer-email", key: "email" },
  { selector: ".footer-whatsapp", key: "whatsapp" },
  { selector: ".single-social", key: "socials" },
];

const STICKER_ROTATIONS = [12, -10, 8, -12, 10, -8];
const rotationFor = (i: number) => STICKER_ROTATIONS[i % STICKER_ROTATIONS.length]!;

/** Adds a listener and returns its removal, so every effect cleans up fully. */
function listen<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document,
  type: K,
  fn: (e: HTMLElementEventMap[K]) => void,
): () => void {
  el.addEventListener(type, fn as EventListener);
  return () => el.removeEventListener(type, fn as EventListener);
}

/** Underline redraws itself on hover. */
function initDrawLink(link: HTMLElement): () => void {
  const paths = Array.from(link.querySelectorAll<SVGPathElement>(".draw-btn__svg path"));
  paths.forEach((path) => gsap.set(path, { strokeDasharray: path.getTotalLength(), strokeDashoffset: 0 }));
  const offEnter = listen(link, "mouseenter", () => {
    gsap.fromTo(
      paths,
      { strokeDashoffset: (_i: number, el: SVGPathElement) => el.getTotalLength() },
      { strokeDashoffset: 0, duration: 0.5, ease: "power2.out", stagger: 0.1, overwrite: true },
    );
  });
  const offLeave = listen(link, "mouseleave", () => {
    gsap.to(paths, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out", overwrite: true });
  });
  return () => {
    offEnter();
    offLeave();
  };
}

/** Stickers get nudged away by a fast-moving cursor, then spring back. */
function initStickerPush(sticker: HTMLElement, baseRotation: number): () => void {
  const RADIUS = 180;
  const STRENGTH = 4;
  const MAX_PUSH = 55;
  const MIN_SPEED = 3;
  const clamp = (v: number) => Math.max(-MAX_PUSH, Math.min(MAX_PUSH, v));
  let prevX = 0;
  let prevY = 0;

  return listen(document, "mousemove", (e) => {
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    const rect = sticker.getBoundingClientRect();
    const dist = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
    const onSticker =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (onSticker || dist >= RADIUS || Math.hypot(dx, dy) <= MIN_SPEED) return;

    const falloff = 1 - dist / RADIUS;
    const pushX = clamp(dx * STRENGTH * falloff);
    const pushY = clamp(dy * STRENGTH * falloff);
    gsap.killTweensOf(sticker);
    gsap.to(sticker, { x: pushX, y: pushY, rotation: baseRotation + pushX * 0.25, duration: 0.18, ease: "power3.out" });
    gsap.to(sticker, { x: 0, y: 0, rotation: baseRotation, duration: 1.1, ease: "elastic.out(1, 0.35)", delay: 0.18 });
  });
}

export default function Footer() {
  const rootRef = useRef<HTMLDivElement>(null);
  // Below the fold: wire up animations once the browser is idle.
  const ready = useIdleReady();

  useEffect(() => {
    const root = rootRef.current;
    if (!ready || !root) return;
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: (() => void)[] = [];
    const reduceMotion = prefersReducedMotion();

    // Everything below is scoped to the footer; ctx.revert() also kills the ScrollTrigger.
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>(".footer-map-link").forEach((link) => cleanups.push(initDrawLink(link)));

      const stickers = gsap.utils.toArray<HTMLElement>(".footer-sticker", root);
      gsap.set(stickers, { scale: 0, opacity: 0, transformOrigin: "center bottom" });
      stickers.forEach((sticker, i) => gsap.set(sticker, { rotation: rotationFor(i) }));
      gsap.to(stickers, {
        scale: 1,
        opacity: 1,
        rotation: (i: number) => rotationFor(i) * 0.7,
        duration: 0.7,
        ease: "back.out(1.7)",
        stagger: 0.12,
        // Reduced motion: stickers simply appear, no pop or bounce.
        ...(reduceMotion && { duration: 0, stagger: 0, ease: "none" }),
        scrollTrigger: {
          trigger: root.querySelector(".footer-stickers") ?? root,
          start: "top 80%",
          toggleActions: "play none none reverse", // play on enter, reverse on leave up
        },
      });
      // No proximity "push" physics for reduced motion.
      if (!reduceMotion) stickers.forEach((sticker, i) => cleanups.push(initStickerPush(sticker, rotationFor(i) * 0.7)));

      for (const { selector, key } of WIGGLE_TARGETS) {
        root.querySelectorAll(selector).forEach((el) => cleanups.push(initWiggle(el, WIGGLE_CONFIG[key])));
      }
    }, root);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [ready]);

  return (
    <div ref={rootRef} className="footer-inner">
      <div className="footer-top">
        <div className="footer-column">
          <span className="footer-badge">wanna join the pack?</span>
          <h3>not hiring right now :(</h3>
          <a href="/shop" className="footer-map-link">
            <span>browse the shop</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              viewBox="0 0 169 10"
              fill="none"
              className="draw-btn__svg"
            >
              <path
                d="M1 6.5661C56.3941 3.06082 112.187 1.20095 168 0.999878"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
              ></path>
              <path
                d="M32.1313 8.63371C68.2147 6.92799 104.462 6.13378 140.695 6.25107"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
              ></path>
            </svg>
          </a>
        </div>
        <div className="footer-column">
          <span className="footer-badge">office</span>
          <address>
            12 bark lane
            <br />
            london N1 7GU
          </address>
          <a href="#" className="footer-map-link">
            <span>Google Maps</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              viewBox="0 0 169 10"
              fill="none"
              className="draw-btn__svg"
            >
              <path
                d="M1 6.5661C56.3941 3.06082 112.187 1.20095 168 0.999878"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
              ></path>
              <path
                d="M32.1313 8.63371C68.2147 6.92799 104.462 6.13378 140.695 6.25107"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
              ></path>
            </svg>
          </a>
        </div>
        <div className="footer-column">
          <span className="footer-badge">contact</span>
          <a href="mailto:hello@cozypaws.co" className="footer-email">
            hello@cozypaws.co
          </a>
          <a href="/contact" className="footer-whatsapp">
            send us a whatsapp*
          </a>
          <p className="footer-note">
            *messages only: we reply within a day, usually with dog photos.
          </p>
          <div className="footer-socials" id="footer-socials">
            {SOCIAL_ICONS.map(({ href, label, svg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="single-social w-inline-block"
                aria-label={label}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-big-text">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            viewBox="0 0 1368 304"
            fill="none"
            className="footer-logo__svg"
          >
            <g fill="currentColor">
              <ellipse
                cx="90"
                cy="140"
                rx="26"
                ry="36"
                transform="rotate(-25 90 140)"
              />
              <ellipse
                cx="148"
                cy="98"
                rx="28"
                ry="39"
                transform="rotate(-8 148 98)"
              />
              <ellipse
                cx="218"
                cy="98"
                rx="28"
                ry="39"
                transform="rotate(8 218 98)"
              />
              <ellipse
                cx="276"
                cy="140"
                rx="26"
                ry="36"
                transform="rotate(25 276 140)"
              />
              <path d="M183 156c-43.5 0-81.5 35-81.5 74.5 0 26.4 20.2 42 42.7 42 14.8 0 26.4-6.2 38.8-6.2s24 6.2 38.8 6.2c22.5 0 42.7-15.6 42.7-42 0-39.5-38-74.5-81.5-74.5z" />
              <text
                x="330"
                y="232"
                fontFamily="Epilogue, sans-serif"
                fontWeight="800"
                fontSize="185"
                letterSpacing="-6"
              >
                CozyPaws
              </text>
            </g>
          </svg>
        </div>

        <div className="footer-stickers">
          <div className="footer-sticker sticker-smiley">
            <img
              loading="lazy"
              src="/assets/Footer-Sticker SVG/footer-sticker-smiley.svg"
              width="100%"
              alt=""
              data-scroll-animation-target=""
              aria-hidden="true"
            />
          </div>
          <div className="footer-sticker sticker-heart">
            <img
              loading="lazy"
              src="/assets/Footer-Sticker SVG/footer-sticker-heart.svg"
              width="100%"
              alt=""
              data-scroll-animation-target=""
              aria-hidden="true"
            />
          </div>
          <div className="footer-sticker sticker-hands">
            <img
              loading="lazy"
              src="/assets/Footer-Sticker SVG/footer-sticker-hands.svg"
              width="100%"
              alt=""
              data-scroll-animation-target=""
              aria-hidden="true"
            />
          </div>
          <div className="footer-sticker sticker-100">
            <img
              loading="lazy"
              src="/assets/Footer-Sticker SVG/footer-sticker-100.svg"
              width="100%"
              alt=""
              data-scroll-animation-target=""
              aria-hidden="true"
            />
          </div>
          <div className="footer-sticker sticker-camera">
            <img
              loading="lazy"
              src="/assets/Footer-Sticker SVG/footer-sticker-camera.svg"
              width="100%"
              alt=""
              aria-hidden="true"
            />
          </div>
          <div className="footer-sticker sticker-boom">
            <img
              loading="lazy"
              src="/assets/Footer-Sticker SVG/footer-sticker-boom.svg"
              width="100%"
              alt=""
              data-scroll-animation-target=""
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
