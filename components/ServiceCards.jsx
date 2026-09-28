"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect } from "react";
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

const shopHref = (category) =>
  `/shop?category=${encodeURIComponent(category).replace(/%20/g, "+")}`;

export default function ServiceCards() {
  // Below the fold: wire up animations once the browser is idle.
  const ready = useIdleReady();

  useIsomorphicLayoutEffect(() => {
    if (!ready) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        ".title-underline-svg path",
        { strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.3,
          scrollTrigger: { trigger: ".title-container", start: "top 70%", once: true },
        },
      );
    });
    return () => mm.revert();
  }, [ready]);

  return (
    <>
      <div className="title-container">
        <h2 className="main-title" id="aisles-title">
          everything your dog <span className="italic-text">needs:</span>
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="160"
          viewBox="0 0 159 17"
          fill="none"
          className="title-underline-svg"
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

      <ul className="aisles" aria-labelledby="aisles-title">
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
    </>
  );
}
