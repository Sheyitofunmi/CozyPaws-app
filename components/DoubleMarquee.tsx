"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { brands, colors } from "@/lib/data";
import { useIdleReady } from "@/lib/hooks/useIdleReady";
import { useHomeSections } from "@/lib/home-sections";

type Brand = (typeof brands)[number];
interface MarqueeItem {
  brand: Brand;
  color: string;
}

function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/** Shuffle so the same logo never sits next to itself, including across the loop seam. */
function shuffleNoAdjacentSrc(array: readonly Brand[]): Brand[] {
  const arr = shuffleArray(array);
  const swap = (i: number, j: number) => ([arr[i], arr[j]] = [arr[j]!, arr[i]!]);
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]!.src !== arr[i - 1]!.src) continue;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j]!.src !== arr[i - 1]!.src) {
        swap(i, j);
        break;
      }
    }
  }
  const last = arr.length - 1;
  if (last > 1 && arr[last]!.src === arr[0]!.src) {
    for (let j = 1; j < last; j++) {
      if (arr[j]!.src !== arr[0]!.src && arr[j]!.src !== arr[last - 1]!.src) {
        swap(last, j);
        break;
      }
    }
  }
  return arr;
}

/** Random tile colours with no two neighbours (or the seam) matching. */
function assignColorsNoAdjacent(count: number, colorPool: readonly string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const prev = i > 0 ? result[i - 1] : undefined;
    const seamColor = i === count - 1 ? result[0] : undefined;
    const available = colorPool.filter((c) => c !== prev && c !== seamColor);
    const pool = available.length > 0 ? available : colorPool.filter((c) => c !== prev);
    result.push(pool[Math.floor(Math.random() * pool.length)]!);
  }
  return result;
}

function buildMarqueeItems(): MarqueeItem[][] {
  return [0, 1].map(() => {
    const shuffledBrands = shuffleNoAdjacentSrc(brands);
    const assignedColors = assignColorsNoAdjacent(shuffledBrands.length, colors);
    const items = shuffledBrands.map((brand, i) => ({ brand, color: assignedColors[i]! }));
    return [...items, ...items]; // duplicate for a seamless loop
  });
}

export default function DoubleMarquee() {
  const sections = useHomeSections();
  const [paused, setPaused] = useState(false);
  const [tracks, setTracks] = useState<MarqueeItem[][]>([[], []]);
  const leftRef = useRef<HTMLDivElement>(null);

  // Below the fold: wire up animations once the browser is idle.
  const ready = useIdleReady();

  useEffect(() => {
    const left = leftRef.current;
    if (!ready || !left) return;
    gsap.registerPlugin(ScrollTrigger);

    // Shuffled on the client only, so server and client HTML match.
    setTracks(buildMarqueeItems());

    // Selector strings below are scoped to the left column by the context.
    const ctx = gsap.context(() => {
      gsap.set(".marquee-svg-item:nth-child(2) path", { strokeDashoffset: 1000 });

      const marqueeTl = gsap.timeline({
        scrollTrigger: {
          trigger: sections?.marquee.current ?? left,
          start: "top 70%",
          toggleActions: "play none none reverse", // replay on scroll out/in
        },
      });
      marqueeTl
        .to(".marquee-underline", { scaleX: 1, opacity: 1, duration: 1, ease: "power2.out" })
        .to(
          ".marquee-svg-item:nth-child(1)",
          { scale: 1, opacity: 1, rotation: -10, duration: 0.6, ease: "back.out(1.7)" },
          "-=0.5",
        )
        .to(
          ".marquee-svg-item:nth-child(2) path",
          { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" },
          "-=0.3",
        );

      // Reduced motion: show the finished state straight away.
      if (prefersReducedMotion()) {
        marqueeTl.scrollTrigger?.kill();
        marqueeTl.progress(1);
      }
    }, left);

    return () => ctx.revert();
  }, [ready, sections]);

  return (
    <>
      <div ref={leftRef} className="marquee-left">
        <div className="marquee-text-container">
          <h2>
            proud to stock
            <br />
            brands <span className="text-with">like:</span>
          </h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="marquee-underline"
            viewBox="0 0 132 5"
            fill="none"
          >
            <path
              d="M1 2.08377C44.3458 3.90451 87.9791 5.71442 131 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="marquee-blob-container">
          <img
            loading="lazy"
            src="/assets/Marquee-blob SVG/marquee-blob.svg"
            className="marquee-blob"
            alt=""
            aria-hidden="true"
          />
          <div className="marquee-svg-container">
            <div className="marquee-svg-item">
              <img
                loading="lazy"
                src="/assets/Marquee-blob SVG/marquee-hand.svg"
                width="100%"
                alt=""
                aria-hidden="true"
              />
            </div>
            <div className="marquee-svg-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                viewBox="0 0 386 127"
                fill="none"
              >
                <path
                  d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L356.5 105.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L384 97"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Anything that moves for more than 5s needs a way to stop it
          (WCAG 2.2.2). Hovering or focusing inside also pauses it. */}
      <div className="marquee-right" data-paused={paused || undefined}>
        {tracks.map((trackItems, colIndex) => (
          <div key={colIndex} className="marquee-column">
            <div className="marquee-track">
              {trackItems.map((item, i) => (
                <div
                  key={i}
                  className="marquee-item"
                  aria-hidden={i >= trackItems.length / 2 || undefined}
                  data-brand={item.brand.name}
                  style={{ backgroundColor: item.color }}
                >
                  <div className="marquee-logo">
                    <div className="marquee-logo__before"></div>
                    <img
                      src={item.brand.src}
                      loading="lazy"
                      alt={item.brand.name}
                      className="cover-image"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="marquee-pause"
          aria-label={paused ? "play the brand logos" : "pause the brand logos"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
            </svg>
          )}
          {paused ? "play" : "pause"}
        </button>
      </div>
    </>
  );
}
