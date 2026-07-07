"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CARDS_DATA } from "@/lib/data";

// GSAP tweens must be reverted synchronously before React unmounts these nodes
// on navigation, otherwise React throws "node to be removed is not a child of
// this node". A layout effect cleanup runs in time; a plain useEffect does not.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The desktop fan spans ~1400px (leftmost card at 50% - 700px), so anything
// narrower gets the swipe carousel instead. Keep in sync with the
// @media (max-width: 1200px) card rules in responsive.css / cards.css.
const DESKTOP_MIN = 1201;

export default function ServiceCards() {
  const wrapperRef = useRef(null);
  const [activeDot, setActiveDot] = useState(0);

  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: `(min-width: ${DESKTOP_MIN}px)`,
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions;

        if (reduceMotion) {
          gsap.set(".title-underline-svg path", { strokeDashoffset: 0 });
          return;
        }

        // Animate underline SVG paths on scroll (from HeroSection)
        gsap.to(".title-underline-svg path", {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.3,
          scrollTrigger: {
            trigger: ".title-container",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        });

        // Below DESKTOP_MIN the cards are a pure-CSS scroll-snap carousel —
        // no GSAP involvement, nothing to set up.
        if (isDesktop) return initDesktopHover();
      },
    );

    return () => mm.revert();
  }, []);

  // Track which card is snapped so the carousel dots stay in sync. Attached
  // natively (not via React's onScroll) because Lenis swallows the delegated
  // event before it reaches React's root listener.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handleScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const index = Math.round(
        (el.scrollLeft / maxScroll) * (CARDS_DATA.length - 1),
      );
      setActiveDot((prev) => (prev === index ? prev : index));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ─── "Call us if you need:" Heading ─── */}
      <div className="title-container">
        <h2 className="main-title">
          everything your dog <span className="italic-text">needs:</span>
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="160"
          viewBox="0 0 159 17"
          fill="none"
          className="title-underline-svg"
        >
          <path
            d="M1 12.1515C53.0771 5.7187 105.529 2.30552 158 1.93652"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <path
            d="M30.2672 15.9461C64.1899 12.8158 98.2663 11.3583 132.33 11.5735"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </div>

      {/* ─── Service Cards ─── */}
      <div
        className="cards-wrapper"
        id="cards-wrapper"
        ref={wrapperRef}
        data-lenis-prevent
      >
        {CARDS_DATA.map((card) => (
          <div key={card.color} className={`card card-${card.color}`}>
            <div className={`card-sticker sticker-${card.sticker}`}>
              <img
                src={`/assets/Card-Sticker SVG/sticker-${card.sticker}.svg`}
                alt=""
                width="100%"
                loading="lazy"
                aria-hidden="true"
              />
            </div>
            <h3 className="card-title">{card.title}</h3>
            <svg
              width="100%"
              height="10"
              className="card-divider-svg"
              aria-hidden="true"
            >
              <use href="#card-divider" />
            </svg>
            <ul className="card-list">
              {card.services.map((service) => (
                <li key={service}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="16"
                    className="services-card__bullet-svg"
                    aria-hidden="true"
                  >
                    <use href="#bullet-icon" />
                  </svg>
                  {service}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Carousel position dots — only visible in the ≤1200px carousel mode */}
      <div className="cards-dots" aria-hidden="true">
        {CARDS_DATA.map((card, i) => (
          <span
            key={card.color}
            className={`cards-dot${i === activeDot ? " is-active" : ""}`}
          />
        ))}
      </div>
    </>
  );
}

// ─── Desktop (≥ DESKTOP_MIN): fanned cards that spread apart on hover ───────
function initDesktopHover() {
  const cards = gsap.utils.toArray(".card");
  if (!cards.length) return;

  const originalData = [
    { rotation: 4 },
    { rotation: -5 },
    { rotation: 5 },
    { rotation: -8 },
    { rotation: 5 },
  ];

  let leaveTimeout = null;
  const teardowns = [];

  cards.forEach((card, index) => {
    const onEnter = () => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        leaveTimeout = null;
      }
      const hoverGap = 120;
      const clusterGap = 150;
      const cardWidth = 320;
      const hoveredLeft = cards[index].offsetLeft;
      const leftCards = [];
      const rightCards = [];

      cards.forEach((otherCard, otherIndex) => {
        if (otherIndex < index)
          leftCards.push({ card: otherCard, index: otherIndex });
        else if (otherIndex > index)
          rightCards.push({ card: otherCard, index: otherIndex });
      });

      const currentTop = cards[index].offsetTop;
      const targetCommonTop = 50;
      const moveY = targetCommonTop - currentTop;

      gsap.to(cards[index], {
        x: 0,
        y: moveY,
        rotation: 0,
        scale: 1.08,
        duration: 0.9,
        ease: "elastic.out(1, 0.5)",
        overwrite: true,
      });

      if (rightCards.length) {
        const clusterStart = hoveredLeft + cardWidth + hoverGap;
        rightCards.forEach((item, i) => {
          const targetAbsLeft = clusterStart + i * clusterGap;
          const targetX = Math.max(targetAbsLeft - item.card.offsetLeft, 10);
          const angleRad = originalData[item.index].rotation * (Math.PI / 180);
          const targetY = targetX * Math.tan(angleRad);
          gsap.to(item.card, {
            x: targetX,
            y: targetY,
            rotation: originalData[item.index].rotation,
            scale: 1,
            duration: 1.0,
            ease: "elastic.out(1, 0.5)",
            overwrite: true,
          });
        });
      }

      if (leftCards.length) {
        leftCards.reverse();
        const clusterStart = hoveredLeft - hoverGap - cardWidth;
        leftCards.forEach((item, i) => {
          const targetAbsLeft = clusterStart - i * clusterGap;
          const targetX = Math.min(targetAbsLeft - item.card.offsetLeft, -10);
          const angleRad = originalData[item.index].rotation * (Math.PI / 180);
          const targetY = targetX * Math.tan(angleRad);
          gsap.to(item.card, {
            x: targetX,
            y: targetY,
            rotation: originalData[item.index].rotation,
            scale: 1,
            duration: 1.0,
            ease: "elastic.out(1, 0.5)",
            overwrite: true,
          });
        });
      }
    };

    const onLeave = () => {
      leaveTimeout = setTimeout(() => {
        cards.forEach((c, i) => {
          gsap.to(c, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: originalData[i].rotation,
            duration: 1.0,
            ease: "elastic.out(1, 0.5)",
            overwrite: true,
            zIndex: i + 1,
          });
        });
      }, 80);
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    teardowns.push(() => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
    });
  });

  return () => {
    if (leaveTimeout) clearTimeout(leaveTimeout);
    teardowns.forEach((teardown) => teardown());
  };
}
