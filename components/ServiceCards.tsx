"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CARDS_DATA } from "@/lib/data";
import { PRODUCTS } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { useIdleReady } from "@/lib/hooks/useIdleReady";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/*
 * "everything your dog needs": the aisle directory. One card per category,
 * listing the actual products in it (most popular first) as links, so every
 * line leads somewhere real. The section above picks a category; this one
 * finds the exact thing.
 *
 * Layout is all CSS (app/styles/cards.css): a gently fanned row from 1200px
 * up, readable at rest, where hovering or tabbing into a card lifts it
 * forward; a swipeable scroll-snap row below that.
 */
const AISLES = CARDS_DATA.map((card) => ({
  ...card,
  products: PRODUCTS.filter((p) => p.category === card.title).sort(
    (a, b) => b.popularity - a.popularity,
  ),
}));

const shopHref = (category: string) =>
  `/shop?category=${encodeURIComponent(category).replace(/%20/g, "+")}`;

export default function ServiceCards() {
  // Below the fold: wire up animations once the browser is idle.
  const ready = useIdleReady();

  // Carousel dots (below 1200px, where the aisles are a swipe row): show
  // which card is in view, and jump to a card when tapped.
  const rowRef = useRef<HTMLUListElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<SVGSVGElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const cards = row.children as HTMLCollectionOf<HTMLElement>;
      const start = row.scrollLeft + parseFloat(getComputedStyle(row).paddingLeft || "0");
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < cards.length; i++) {
        const dist = Math.abs(cards[i]!.offsetLeft - start);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      // At the very end the last card can't snap to the start edge.
      if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) best = cards.length - 1;
      setCurrent(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      row.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (i: number) => {
    const row = rowRef.current;
    const card = row?.children[i] as HTMLElement | undefined;
    if (!row || !card) return;
    const pad = parseFloat(getComputedStyle(row).paddingLeft || "0");
    const smooth = !window.matchMedia(REDUCED_MOTION_QUERY).matches;
    row.scrollTo({ left: card.offsetLeft - pad, behavior: smooth ? "smooth" : "auto" });
  };

  useIsomorphicLayoutEffect(() => {
    const title = titleRef.current;
    const underline = underlineRef.current;
    if (!ready || !title || !underline) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        underline.querySelectorAll("path"),
        { strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.3,
          scrollTrigger: { trigger: title, start: "top 70%", once: true },
        },
      );
    });
    return () => mm.revert();
  }, [ready]);

  return (
    <>
      <div ref={titleRef} className="title-container">
        <h2 className="main-title" id="aisles-title">
          everything your dog <span className="italic-text">needs:</span>
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="160"
          viewBox="0 0 159 17"
          fill="none"
          className="title-underline-svg"
          ref={underlineRef}
          aria-hidden="true"
        >
          <path
            d="M1 12.1515C53.0771 5.7187 105.529 2.30552 158 1.93652"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M30.2672 15.9461C64.1899 12.8158 98.2663 11.3583 132.33 11.5735"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <ul ref={rowRef} id="aisles-row" className="aisles" aria-labelledby="aisles-title">
        {AISLES.map((aisle) => (
          <li key={aisle.color} className={`aisle aisle--${aisle.color}`}>
            <span className={`aisle__sticker aisle__sticker--${aisle.sticker}`} aria-hidden="true">
              <img src={`/assets/Card-Sticker SVG/sticker-${aisle.sticker}.svg`} alt="" loading="lazy" />
            </span>

            <div className="aisle__head">
              <h3 className="aisle__title">{aisle.title}</h3>
              <span className="aisle__count">
                {aisle.products.length} products
              </span>
            </div>
            <svg width="100%" height="10" className="aisle__divider" aria-hidden="true">
              <use href="#card-divider" />
            </svg>

            <ul className="aisle__list">
              {aisle.products.map((product) => (
                <li key={product.id}>
                  <Link href={`/shop/${product.id}`} className="aisle__item">
                    <svg width="13" height="16" className="aisle__bullet" aria-hidden="true">
                      <use href="#bullet-icon" />
                    </svg>
                    <span className="aisle__name">{product.name}</span>
                    <span className="aisle__price">{formatPrice(product.priceCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link href={shopHref(aisle.title)} className="aisle__cta">
              shop {aisle.title}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>

      <div className="aisle-dots" aria-label="Aisles">
        {AISLES.map((aisle, i) => (
          <button
            key={aisle.color}
            type="button"
            className={`aisle-dot aisle-dot--${aisle.color}`}
            aria-label={`Show ${aisle.title}`}
            aria-controls="aisles-row"
            aria-current={i === current ? "true" : undefined}
            onClick={() => goTo(i)}
          >
            <span />
          </button>
        ))}
      </div>
    </>
  );
}
