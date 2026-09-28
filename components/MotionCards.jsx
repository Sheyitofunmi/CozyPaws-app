"use client";

import gsap from "gsap";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SmartImage from "@/components/SmartImage";
import { IconArrowRight } from "@/components/icons";
import { useIdleReady } from "@/lib/hooks/useIdleReady";

gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger);

/*
 * "a store built for good dogs": copy on the left, a fanned deck of photos on
 * the right. Each photo is a way into a shop category. The photos can be
 * dragged and flung (mouse or touch) and spring back to their spot.
 */
const CARDS = [
  {
    category: "food & treats",
    src: "/assets/products/peanut-butter-bites.jpg",
    w: 1000,
    h: 1000,
    alt: "A dog taking a treat",
  },
  {
    category: "toys & play",
    src: "/assets/home/play.jpg",
    w: 1000,
    h: 1000,
    alt: "A collie running with a ball",
    tape: { text: "boring toys = old fashioned", tone: "lime" },
  },
  {
    category: "comfy beds",
    src: "/assets/products/cloud-nine-bed.jpg",
    w: 1000,
    h: 1000,
    alt: "A puppy curled up in a round bed",
    tape: { text: "spoiled is not a dirty word", tone: "orange" },
  },
  {
    category: "walk & travel",
    src: "/assets/home/sunglasses.jpg",
    w: 1000,
    h: 1000,
    alt: "A dog wearing sunglasses",
    tape: { text: "dogs just wanna have fun!", tone: "pink" },
  },
  {
    category: "grooming & care",
    src: "/assets/pets/gromming.avif",
    w: 900,
    h: 1350,
    alt: "A fluffy dog being groomed",
  },
];

const HINT_KEY = "cozypaws-threw-a-card";

const shopHref = (category) =>
  `/shop?category=${encodeURIComponent(category).replace(/%20/g, "+")}`;

export default function MotionCards() {
  const sectionRef = useRef(null);
  const deckRef = useRef(null);
  const nextRef = useRef(null);

  // Below the fold: wire up animations once the browser is idle.
  const ready = useIdleReady();

  useEffect(() => {
    if (!ready) return;
    const section = sectionRef.current;
    const deck = deckRef.current;
    if (!section || !deck) return;

    // Anyone who already threw a card doesn't need the hint again.
    try {
      if (window.localStorage.getItem(HINT_KEY))
        deck.classList.add("has-thrown");
    } catch {
      /* storage blocked: keep the hint */
    }

    const cards = gsap.utils.toArray(".mc-card", deck);
    const markThrown = () => {
      deck.classList.add("has-thrown");
      try {
        window.localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    const springBack = (el) =>
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.9,
        ease: "elastic.out(1, 0.55)",
        overwrite: "auto",
      });

    const mm = gsap.matchMedia(section);
    mm.add(
      {
        wide: "(min-width: 769px)",
        phone: "(max-width: 768px)",
        motion: "(prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { wide, phone, motion } = ctx.conditions;

        // ── Phones: the photos are a pile. Swipe (or tap "next photo") to send
        // the top one to the back, so every photo gets its turn at full size.
        let order = [...cards];
        const restack = () =>
          order.forEach((card, i) => {
            card.style.zIndex = String(order.length - i);
            card.classList.toggle("is-top", i === 0);
            card
              .querySelector("a")
              ?.setAttribute("tabindex", i === 0 ? "0" : "-1");
          });
        const sendToBack = (dir = 1) => {
          const card = order[0];
          const done = () => {
            order = [...order.slice(1), card];
            restack();
          };
          if (!motion) return done();
          gsap
            .timeline()
            .to(card, {
              x: dir * window.innerWidth * 0.7,
              rotation: dir * 14,
              duration: 0.28,
              ease: "power2.in",
            })
            .add(done)
            .to(card, {
              x: 0,
              rotation: 0,
              duration: 0.55,
              ease: "back.out(1.4)",
            });
          markThrown();
        };
        if (phone) {
          restack();
          nextRef.current = () => sendToBack(1);
        }

        if (motion) {
          // Entrance: the photos fan out from a stack as the section arrives.
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          });
          const deckMid = deck.offsetWidth / 2;
          tl.from(cards, {
            x: (i, el) =>
              wide ? deckMid - (el.offsetLeft + el.offsetWidth / 2) : 0,
            y: 40,
            opacity: 0,
            duration: 0.9,
            ease: "back.out(1.3)",
            stagger: 0.07,
          });
          const sticker = section.querySelector(".motion-card__sticker img");
          if (sticker) {
            tl.from(
              sticker,
              {
                scale: 0,
                opacity: 0,
                rotation: -30,
                duration: 1.4,
                ease: "elastic.out(1, 0.4)",
              },
              0.2,
            );
          }
          const underline = section.querySelector(
            ".motion-card__underline-path",
          );
          if (underline) {
            const len = underline.getTotalLength();
            gsap.set(underline, {
              strokeDasharray: len,
              strokeDashoffset: len,
            });
            tl.to(
              underline,
              { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" },
              0.2,
            );
          }
        }

        let draggables = [];
        if (motion && wide) {
          // Fan: grab any photo and fling it; it springs back to its spot.
          const touch = window.matchMedia("(hover: none)").matches;
          let top = 10;
          draggables = Draggable.create(cards, {
            type: touch ? "x" : "x,y",
            allowNativeTouchScrolling: touch,
            dragClickables: true,
            inertia: true,
            maxDuration: 0.6,
            onPress() {
              top += 1;
              this.target.style.zIndex = String(top);
            },
            onDragStart() {
              this.target.dataset.dragged = "1";
              markThrown();
            },
            onRelease() {
              if (!this.isThrowing) springBack(this.target);
            },
            onThrowComplete() {
              springBack(this.target);
            },
          });
        } else if (motion && phone) {
          // Pile: sideways swipes only, so vertical swipes still scroll the page.
          draggables = Draggable.create(cards, {
            type: "x",
            allowNativeTouchScrolling: true,
            dragClickables: true,
            onDragStart() {
              this.target.dataset.dragged = "1";
            },
            onRelease() {
              if (Math.abs(this.x) > 70) {
                gsap.set(this.target, { x: this.x });
                sendToBack(this.x > 0 ? 1 : -1);
              } else {
                springBack(this.target);
              }
            },
          });
        }

        // A drag shouldn't also count as a click on the photo's link.
        const blockClickAfterDrag = (e) => {
          const card = e.target.closest(".mc-card");
          if (card?.dataset.dragged) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (card) delete card.dataset.dragged;
        };
        const clearOnPress = (e) => {
          const card = e.target.closest(".mc-card");
          if (card) delete card.dataset.dragged;
        };
        deck.addEventListener("click", blockClickAfterDrag, true);
        deck.addEventListener("pointerdown", clearOnPress, true);

        return () => {
          draggables.forEach((d) => d.kill());
          deck.removeEventListener("click", blockClickAfterDrag, true);
          deck.removeEventListener("pointerdown", clearOnPress, true);
          nextRef.current = null;
          cards.forEach((card) => {
            card.style.zIndex = "";
            card.classList.remove("is-top");
            card.querySelector("a")?.removeAttribute("tabindex");
          });
        };
      },
    );

    return () => mm.revert();
  }, [ready]);

  return (
    <section
      ref={sectionRef}
      className="motion-card-section"
      id="motion-card-section"
    >
      <div className="mc-layout">
        <div className="mc-copy">
          <span className="motion-card__sticker" aria-hidden="true">
            <img
              loading="lazy"
              src="/assets/Footer-Sticker SVG/footer-sticker-hands.svg"
              alt=""
            />
          </span>
          <h2 className="motion-card__title">
            a store built
            <br />
            for good dogs.
          </h2>
          <p className="motion-card__subtitle">from pup to senior.</p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 634 28"
            fill="none"
            className="motion-card__underline-svg"
            aria-hidden="true"
          >
            <path
              className="motion-card__underline-path"
              d="M2 26C41.0237 23.1556 79.9927 19.9419 118.634 15.5521C169.106 9.98633 227.314 2.42393 275.206 2C280.46 2.57436 264.768 4.99488 262.462 5.55556C257.837 6.43078 252.529 7.47009 247.317 8.59146C239.594 10.3556 212.496 15.8393 226.932 19.8051C239.594 22.6359 263.663 21.9521 280.978 21.3504C314.817 19.9829 349.311 16.7419 383.204 14.7863C465.931 9.5077 549.191 10.547 632 14.1436"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="motion-card__description">
            To make a dog happy you need to know what makes them tick. We stock
            the whole spectrum, from crunchy treats to squeaky toys and from
            cozy beds to all-weather walking gear.
          </p>
          <Link href="/shop" className="cozy-btn-orange mc-cta">
            shop everything <IconArrowRight className="cozy-btn-orange__icon" />
          </Link>
        </div>

        <div ref={deckRef} className="mc-deck">
          <div className="motion-card__blob" aria-hidden="true">
            <img
              loading="lazy"
              src="/assets/MotionCard SVG/motion-card-blob.svg"
              alt=""
            />
          </div>
          <ul className="mc-deck__cards" aria-label="Shop by category">
            {CARDS.map((card, i) => (
              <li key={card.category} className={`mc-card mc-card--${i + 1}`}>
                {/* GSAP drags the <li>; the tilt and hover lift live on this
                    inner layer so the two sets of transforms never fight. */}
                <div className="mc-card__tilt">
                  <Link
                    href={shopHref(card.category)}
                    className="mc-card__link"
                    draggable={false}
                  >
                    <span className="mc-card__photo">
                      <SmartImage
                        src={card.src}
                        alt={card.alt}
                        width={card.w}
                        height={card.h}
                        loading="lazy"
                        sizes="(max-width: 768px) 46vw, 260px"
                        draggable={false}
                      />
                    </span>
                    <span className="mc-card__label">
                      {card.category}
                      <IconArrowRight className="mc-card__arrow" />
                    </span>
                  </Link>
                  {card.tape && (
                    <span
                      className={`mc-tape mc-tape--${card.tape.tone}`}
                      aria-hidden="true"
                    >
                      {card.tape.text}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mc-next"
            onClick={() => nextRef.current?.()}
          >
            next photo, or swipe
            <IconArrowRight className="mc-next__icon" />
          </button>
          <p className="mc-hint" aria-hidden="true">
            <span className="mc-hint__wide">psst… throw one</span>
            <span className="mc-hint__phone">psst… swipe one</span>
            <svg viewBox="0 0 60 40" fill="none">
              <path
                d="M4 6c14 0 30 6 38 20m0 0-2-10m2 10-10-3"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </p>
        </div>
      </div>
    </section>
  );
}
