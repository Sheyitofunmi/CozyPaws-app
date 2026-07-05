"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/assets/pets/reel-flowers.jpg",
    caption: "fresh flowers, free tail wags",
  },
  { src: "/assets/pets/reel-catwalk.jpg", caption: "too cool for the catwalk" },
  { src: "/assets/pets/reel-spa.jpg", caption: "spa day, best day" },
  { src: "/assets/pets/reel-cozy.jpg", caption: "cozy is a lifestyle" },
  { src: "/assets/pets/reel-toy.jpg", caption: "new wheels, who dis?" },
  { src: "/assets/pets/reel-denim.jpg", caption: "denim season is here" },
  { src: "/assets/pets/reel-goodnight.jpg", caption: "goodnight, good dog" },
];

const SLIDE_MS = 4200;

export default function Showreel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      SLIDE_MS,
    );
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section className="showreel-section" id="showreel-section">
      <div
        className={`showreel-reel ${paused ? "is-paused" : ""}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`showreel-reel__slide ${i % 2 === 0 ? "showreel-reel__slide--in" : "showreel-reel__slide--out"} ${i === active ? "is-active" : ""}`}
          >
            <img
              src={slide.src}
              alt=""
              aria-hidden="true"
              className="showreel-reel__bg"
              loading="lazy"
            />
            <img
              src={slide.src}
              alt={slide.caption}
              className="showreel-reel__fg"
              loading="lazy"
            />
            <p className="showreel-reel__caption">{slide.caption}</p>
          </div>
        ))}

        {/* Bottom gradient so title/caption/dots stay readable */}
        <div className="showreel-reel__fade" />

        <div className="showreel__content showreel-reel__overlay">
          <h2 className="showreel__title">Happy Dogs Reel</h2>
          <p className="showreel__subtitle">Wagging tails on repeat</p>
        </div>

        <img
          src="/assets/pets/paw-sticker.svg"
          className="showreel-reel__paw showreel-reel__paw--left"
          alt=""
          aria-hidden="true"
        />
        <img
          src="/assets/pets/paw-sticker.svg"
          className="showreel-reel__paw showreel-reel__paw--right"
          alt=""
          aria-hidden="true"
        />

        <div className="showreel-reel__dots">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              className={`showreel-reel__dot ${i === active ? "is-active" : ""}`}
              aria-label={`Go to picture ${i + 1}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
