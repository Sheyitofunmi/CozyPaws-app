"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { HERO_REEL } from "@/lib/hero-reel";
import { useHeroReel } from "@/lib/hooks/useHeroReel";

function PawGlyph() {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <ellipse cx="256" cy="352" rx="120" ry="96" />
      <ellipse cx="118" cy="220" rx="52" ry="70" />
      <ellipse cx="212" cy="140" rx="48" ry="66" />
      <ellipse cx="300" cy="140" rx="48" ry="66" />
      <ellipse cx="394" cy="220" rx="52" ry="70" />
    </svg>
  );
}

/* ── Brand-flat animal glyphs ──────────────────────────────────────────────
   Each animal nests: .animal__click > .animal__pose > .animal__bob so the CSS
   can drive bounce / hover-reaction / body-bob on separate wrappers, while
   legs + tail carry their own keyframes. Dog faces right, cat faces left.    */

function DogGlyph() {
  return (
    <div className="animal__click">
      <div className="animal__pose">
        <div className="animal__bob">
          <svg viewBox="0 0 200 130" aria-hidden="true">
            <rect
              className="animal__leg animal__leg--b"
              x="60"
              y="80"
              width="13"
              height="36"
              rx="6"
              fill="#d94f22"
            />
            <rect
              className="animal__leg animal__leg--a"
              x="128"
              y="80"
              width="13"
              height="36"
              rx="6"
              fill="#d94f22"
            />
            <path
              className="animal__tail"
              d="M44 60 C24 52 18 40 22 30 C30 40 40 46 50 52 Z"
              fill="var(--color-orange)"
            />
            <rect
              x="42"
              y="46"
              width="112"
              height="46"
              rx="23"
              fill="var(--color-orange)"
            />
            <circle cx="164" cy="54" r="25" fill="var(--color-orange)" />
            <path
              d="M150 34 q-6 -16 8 -18 q2 12 -2 22 Z"
              fill="var(--color-orange)"
            />
            <rect x="180" y="52" width="18" height="16" rx="7" fill="#d94f22" />
            <circle cx="170" cy="50" r="3.4" fill="#3a1608" />
            <circle cx="195" cy="58" r="2.6" fill="#3a1608" />
            <rect
              className="animal__leg animal__leg--a"
              x="74"
              y="80"
              width="14"
              height="38"
              rx="7"
              fill="#b53c17"
            />
            <rect
              className="animal__leg animal__leg--b"
              x="140"
              y="80"
              width="14"
              height="38"
              rx="7"
              fill="#b53c17"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function CatGlyph() {
  return (
    <div className="animal__click">
      <div className="animal__pose">
        <div className="animal__bob">
          <svg viewBox="0 0 200 130" aria-hidden="true">
            <rect
              className="animal__leg animal__leg--b"
              x="128"
              y="82"
              width="11"
              height="34"
              rx="5"
              fill="#6f8ce0"
            />
            <rect
              className="animal__leg animal__leg--a"
              x="66"
              y="82"
              width="11"
              height="34"
              rx="5"
              fill="#6f8ce0"
            />
            <path
              className="animal__tail"
              d="M156 66 C182 62 186 40 176 26 C190 40 190 66 168 78 Z"
              fill="var(--color-lightblue)"
            />
            <rect
              x="54"
              y="52"
              width="104"
              height="38"
              rx="19"
              fill="var(--color-lightblue)"
            />
            <circle cx="52" cy="58" r="22" fill="var(--color-lightblue)" />
            <path d="M36 40 L30 20 L48 34 Z" fill="var(--color-lightblue)" />
            <path d="M60 36 L64 16 L74 38 Z" fill="var(--color-lightblue)" />
            <circle cx="46" cy="56" r="3" fill="#20305e" />
            <circle cx="36" cy="60" r="2" fill="#20305e" />
            <rect
              className="animal__leg animal__leg--a"
              x="78"
              y="82"
              width="12"
              height="36"
              rx="6"
              fill="#4b69f0"
            />
            <rect
              className="animal__leg animal__leg--b"
              x="114"
              y="82"
              width="12"
              height="36"
              rx="6"
              fill="#4b69f0"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function BirdGlyph() {
  return (
    <svg viewBox="0 0 62 46" aria-hidden="true">
      <ellipse cx="31" cy="26" rx="15" ry="10" fill="var(--color-pink)" />
      <circle cx="46" cy="20" r="7" fill="var(--color-pink)" />
      <path d="M52 18 l8 -2 l-7 5 Z" fill="var(--color-orange)" />
      <circle cx="47" cy="19" r="1.6" fill="#5a2740" />
      <path
        className="dio-bird__wing dio-bird__wing--left"
        d="M28 24 L6 12 L26 28 Z"
        fill="#e79ff2"
      />
      <path
        className="dio-bird__wing dio-bird__wing--right"
        d="M34 24 L56 12 L36 28 Z"
        fill="#e79ff2"
      />
    </svg>
  );
}

function TreesGlyph() {
  return (
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <path
        className="tree-fill--back"
        d="M0 300 V170 Q90 120 180 165 Q250 90 340 150 Q430 100 520 160 Q640 110 760 160 Q880 110 1000 165 Q1100 130 1200 170 V300 Z"
      />
      <path
        className="tree-fill"
        d="M0 300 V210 Q120 170 250 205 Q360 160 480 205 Q600 165 720 205 Q850 165 980 205 Q1100 175 1200 210 V300 Z"
      />
      <circle className="tree-fill" cx="150" cy="205" r="52" />
      <circle className="tree-fill" cx="470" cy="200" r="60" />
      <circle className="tree-fill" cx="820" cy="205" r="50" />
      <circle className="tree-fill" cx="1080" cy="210" r="46" />
    </svg>
  );
}

/* Deterministic (SSR-safe) scene data */
const CLOUDS = [1, 2, 3, 4];
const PAW_PRINTS = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  left: 8 + i * 12,
  delay: i * 0.6,
  flip: i % 2 === 0,
}));
const STARS = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left: (i * 53.13) % 100,
  top: (i * 29.7 + 3) % 46,
  delay: (i % 6) * 0.5,
}));

export default function VimeoHero({ onAnimalClick } = {}) {
  const playerRef = useRef(null);
  const bubbleRef = useRef(null);
  const titleRef = useRef(null);
  const controlsRef = useRef(null);
  const sceneRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const reel = useHeroReel(HERO_REEL, playerRef);
  const isPlaying = reel.playing;

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* Diorama state: night flag (auto by clock) + per-animal click bounce.
     Both start at their SSR-safe defaults and are corrected on the client. */
  const [isNight, setIsNight] = useState(false);
  const [bounced, setBounced] = useState({});

  useEffect(() => {
    const applyTime = () => {
      const h = new Date().getHours();
      setIsNight(h < 6 || h >= 18);
    };
    applyTime();
    const id = setInterval(applyTime, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY || window.pageYOffset || 0;
      scene.style.setProperty("--p-sky", `${y * 0.08}px`);
      scene.style.setProperty("--p-clouds", `${y * 0.18}px`);
      scene.style.setProperty("--p-trees", `${y * 0.34}px`);
      scene.style.setProperty("--p-ground", `${y * 0.52}px`);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activateAnimal = (category) => {
    setBounced((b) => ({ ...b, [category]: true }));
    window.setTimeout(
      () => setBounced((b) => ({ ...b, [category]: false })),
      600,
    );
    onAnimalClick?.(category);
  };

  const animalKeyDown = (category) => (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      activateAnimal(category);
    }
  };

  useEffect(() => {
    const bubble = bubbleRef.current;
    const hero = playerRef.current;
    const title = titleRef.current;
    const controls = controlsRef.current;
    if (!bubble || !hero) return;

    const xTo = gsap.quickTo(bubble, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(bubble, "y", { duration: 0.5, ease: "power3" });

    const onMove = (e) => {
      xTo(e.clientX + 13);
      yTo(e.clientY - 43);
    };

    const onEnter = () => {
      gsap.killTweensOf(bubble, "opacity,scale,rotation");
      gsap.to(bubble, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1.7,
        delay: 0.05,
        ease: "elastic.out(1, 0.4)",
      });
    };

    const onLeave = () => {
      gsap.killTweensOf(bubble, "opacity,scale,rotation");
      gsap.to(bubble, {
        opacity: 0,
        scale: 0,
        rotation: -30,
        duration: 0.3,
        ease: "sine.inOut",
      });
    };

    const hideBubbleForElement = () => {
      gsap.killTweensOf(bubble, "opacity,scale,rotation");
      gsap.to(bubble, {
        opacity: 0,
        scale: 0,
        rotation: -30,
        duration: 0.3,
        ease: "sine.inOut",
      });
    };

    const showBubbleForElement = () => {
      gsap.killTweensOf(bubble, "opacity,scale,rotation");
      gsap.to(bubble, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "sine.inOut",
      });
    };

    const onTitleEnter = () => {
      hideBubbleForElement();
      if (controls)
        gsap.to(controls, { opacity: 0, duration: 0.3, pointerEvents: "none" });
    };

    const onTitleLeave = () => {
      showBubbleForElement();
      if (controls)
        gsap.to(controls, { opacity: 1, duration: 0.3, pointerEvents: "auto" });
    };

    window.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseenter", onEnter);
    hero.addEventListener("mouseleave", onLeave);

    if (title) {
      title.addEventListener("mouseenter", onTitleEnter);
      title.addEventListener("mouseleave", onTitleLeave);
    }
    if (controls) {
      controls.addEventListener("mouseenter", hideBubbleForElement);
      controls.addEventListener("mouseleave", showBubbleForElement);
    }

    return () => {
      window.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseenter", onEnter);
      hero.removeEventListener("mouseleave", onLeave);

      if (title) {
        title.removeEventListener("mouseenter", onTitleEnter);
        title.removeEventListener("mouseleave", onTitleLeave);
      }
      if (controls) {
        controls.removeEventListener("mouseenter", hideBubbleForElement);
        controls.removeEventListener("mouseleave", showBubbleForElement);
      }
    };
  }, []);

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    reel.toggle();
  };

  const toggleFullscreen = (e) => {
    if (e) e.stopPropagation();
    if (!document.fullscreenElement) playerRef.current?.requestFullscreen?.();
    else document.exitFullscreen();
  };

  return (
    <>
      <div
        ref={bubbleRef}
        className={`vimeo-mute-bubble ${isPlaying ? "is--playing" : "is--paused"}`}
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <div className="vimeo-mute-bubble__blob">
          <img
            src="/assets/VimeoHero SVG/mute-bubble-blob.svg"
            alt=""
            className="vimeo-mute-bubble__blob-svg"
          />
          <div className="vimeo-mute-bubble__icon vimeo-mute-bubble__pause">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.2" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" />
            </svg>
          </div>
          <div className="vimeo-mute-bubble__icon vimeo-mute-bubble__play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.2-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" />
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`vimeo-hero ${isPlaying ? "is-playing" : "is-paused"}`}
        ref={playerRef}
        onClick={togglePlay}
      >
        <div
          className={`anim-hero ${isNight ? "is-night" : "is-day"}`}
          ref={sceneRef}
        >
          <div className="dio-layer dio-sky" aria-hidden="true">
            <div className="dio-celestial" />
            {STARS.map((s) => (
              <span
                key={s.id}
                className="dio-star"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>

          <div className="dio-layer dio-clouds" aria-hidden="true">
            {CLOUDS.map((n) => (
              <span key={n} className={`dio-cloud dio-cloud--${n}`} />
            ))}
          </div>

          <div className="dio-layer dio-trees" aria-hidden="true">
            <TreesGlyph />
          </div>

          <div className="dio-layer dio-ground" aria-hidden="true">
            <div className="dio-path" />
          </div>

          <div className="dio-foreground">
            <div className="dio-bird" aria-hidden="true">
              <BirdGlyph />
            </div>

            {PAW_PRINTS.map((p) => (
              <span
                key={p.id}
                className="dio-paw"
                aria-hidden="true"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  transform: p.flip ? "scaleX(-1)" : "none",
                }}
              >
                <PawGlyph />
              </span>
            ))}

            <div
              className={`animal animal--dog ${bounced.dogs ? "is-bounced" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Playful dog — shop for dogs"
              onClick={(e) => {
                e.stopPropagation();
                activateAnimal("dogs");
              }}
              onKeyDown={animalKeyDown("dogs")}
            >
              <DogGlyph />
            </div>

            <div
              className={`animal animal--cat ${bounced.cats ? "is-bounced" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Strolling cat — shop for cats"
              onClick={(e) => {
                e.stopPropagation();
                activateAnimal("cats");
              }}
              onKeyDown={animalKeyDown("cats")}
            >
              <CatGlyph />
            </div>
          </div>
        </div>

        {/* Real footage on top of the illustrated scene. The scene stays
            underneath as the fallback (reduced motion, Save-Data, load errors)
            and until the first clip is actually playing. */}
        <div className={`hero-reel ${reel.started ? "is-started" : ""}`} aria-hidden="true">
          {[reel.videoA, reel.videoB].map((ref, which) => (
            <video
              key={which}
              ref={ref}
              className={`hero-reel__video ${reel.slot === which ? "is-active" : ""}`}
              muted
              playsInline
              preload="none"
              disablePictureInPicture
              tabIndex={-1}
            />
          ))}
        </div>

        <div className="vimeo-hero__fade" />

        <div className="home-header__title">
          <h1
            className="vimeo-hero__title"
            ref={titleRef}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="vimeo-hero__word">we </span>

            <span className="vimeo-hero__word is--relative">
              <span>make </span>
              <div className="home-header__smiley">
                <img
                  src="/assets/VimeoHero SVG/smiley-face.svg"
                  alt=""
                  className="home-header__smiley-svg"
                />
              </div>
            </span>

            <span className="vimeo-hero__word">
              <em>shopping </em>
            </span>

            <span className="vimeo-hero__word">fun </span>

            <div style={{ flexBasis: "100%", height: 0 }} />

            <span className="vimeo-hero__word">for </span>
            <span className="vimeo-hero__word">your </span>

            <span className="vimeo-hero__word is--relative">
              <div className="home-header__star">
                <div className="home-header__star-inner">
                  <img
                    src="/assets/VimeoHero SVG/pink-star.svg"
                    alt=""
                    className="home-header__star-svg"
                  />
                </div>
              </div>
              <img
                src="/assets/VimeoHero SVG/oval-underline.svg"
                alt=""
                className="home-header__title-line-svg"
              />
              <span>dog</span>
            </span>
          </h1>
        </div>

        <div
          className="vimeo-hero__controls"
          ref={controlsRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="vimeo-hero__btn"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause dog videos" : "Play dog videos"}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M5.5 5.125H8.5C8.70711 5.125 8.875 5.29289 8.875 5.5V18.5C8.875 18.7071 8.70711 18.875 8.5 18.875H5.5C5.29289 18.875 5.125 18.7071 5.125 18.5V5.5C5.125 5.29289 5.29289 5.125 5.5 5.125Z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeMiterlimit="10"
                />
                <path
                  d="M15.5 5.125H18.5C18.7071 5.125 18.875 5.29289 18.875 5.5V18.5C18.875 18.7071 18.7071 18.875 18.5 18.875H15.5C15.2929 18.875 15.125 18.7071 15.125 18.5V5.5C15.125 5.29289 15.2929 5.125 15.5 5.125Z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeMiterlimit="10"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 12V5.20128C6 4.37664 6.89256 3.86113 7.60685 4.27322L19.3914 11.072C20.1061 11.4843 20.1061 12.5158 19.3914 12.9281L7.60685 19.7269C6.89256 20.139 6 19.6234 6 18.7988V12Z"
                  stroke="currentColor"
                  strokeWidth="1.33929"
                  strokeMiterlimit="10"
                />
              </svg>
            )}
          </button>

          <ol className="hero-reel__steps" ref={reel.progressRef} aria-label="Clips">
            {HERO_REEL.map((clip, i) => (
              <li key={clip.src}>
                <button
                  type="button"
                  className={`hero-reel__step ${i < reel.index ? "is-done" : ""} ${i === reel.index ? "is-current" : ""}`}
                  aria-label={`Clip ${i + 1} of ${HERO_REEL.length}: ${clip.label}`}
                  aria-current={i === reel.index ? "true" : undefined}
                  onClick={() => reel.goTo(i)}
                >
                  <span className="hero-reel__bar" />
                </button>
              </li>
            ))}
          </ol>

          <button
            className="vimeo-hero__btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {!isFullscreen ? (
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.5 3.95833C2.5 3.15292 3.15292 2.5 3.95833 2.5H6.875C7.22017 2.5 7.5 2.77983 7.5 3.125C7.5 3.47017 7.22017 3.75 6.875 3.75H3.95833C3.84327 3.75 3.75 3.84327 3.75 3.95833V6.875C3.75 7.22017 3.47017 7.5 3.125 7.5C2.77983 7.5 2.5 7.22017 2.5 6.875V3.95833ZM12.5 3.125C12.5 2.77983 12.7798 2.5 13.125 2.5H16.0417C16.8471 2.5 17.5 3.15292 17.5 3.95833V6.875C17.5 7.22017 17.2202 7.5 16.875 7.5C16.5298 7.5 16.25 7.22017 16.25 6.875V3.95833C16.25 3.84327 16.1567 3.75 16.0417 3.75H13.125C12.7798 3.75 12.5 3.47017 12.5 3.125ZM3.125 12.5C3.47017 12.5 3.75 12.7798 3.75 13.125V16.0417C3.75 16.1567 3.84327 16.25 3.95833 16.25H6.875C7.22017 16.25 7.5 16.5298 7.5 16.875C7.5 17.2202 7.22017 17.5 6.875 17.5H3.95833C3.15292 17.5 2.5 16.8471 2.5 16.0417V13.125C2.5 12.7798 2.77983 12.5 3.125 12.5ZM16.875 12.5C17.2202 12.5 17.5 12.7798 17.5 13.125V16.0417C17.5 16.8471 16.8471 17.5 16.0417 17.5H13.125C12.7798 17.5 12.5 17.2202 12.5 16.875C12.5 16.5298 12.7798 16.25 13.125 16.25H16.0417C16.1567 16.25 16.25 16.1567 16.25 16.0417V13.125C16.25 12.7798 16.5298 12.5 16.875 12.5Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d="M6.04167 7.5C6.84708 7.5 7.5 6.84708 7.5 6.04167L7.5 3.125C7.5 2.77983 7.22017 2.5 6.875 2.5C6.52982 2.5 6.25 2.77983 6.25 3.125L6.25 6.04167C6.25 6.15673 6.15672 6.25 6.04167 6.25L3.125 6.25C2.77983 6.25 2.5 6.52983 2.5 6.875C2.5 7.22018 2.77983 7.5 3.125 7.5L6.04167 7.5Z"
                  fill="currentColor"
                />
                <path
                  d="M16.875 7.5C17.2202 7.5 17.5 7.22017 17.5 6.875C17.5 6.52982 17.2202 6.25 16.875 6.25L13.9583 6.25C13.8433 6.25 13.75 6.15673 13.75 6.04167L13.75 3.125C13.75 2.77983 13.4702 2.5 13.125 2.5C12.7798 2.5 12.5 2.77983 12.5 3.125L12.5 6.04167C12.5 6.84708 13.1529 7.5 13.9583 7.5L16.875 7.5Z"
                  fill="currentColor"
                />
                <path
                  d="M12.5 16.875C12.5 17.2202 12.7798 17.5 13.125 17.5C13.4702 17.5 13.75 17.2202 13.75 16.875L13.75 13.9583C13.75 13.8433 13.8433 13.75 13.9583 13.75L16.875 13.75C17.2202 13.75 17.5 13.4702 17.5 13.125C17.5 12.7798 17.2202 12.5 16.875 12.5L13.9583 12.5C13.1529 12.5 12.5 13.1529 12.5 13.9583L12.5 16.875Z"
                  fill="currentColor"
                />
                <path
                  d="M6.25 16.875C6.25 17.2202 6.52982 17.5 6.875 17.5C7.22017 17.5 7.5 17.2202 7.5 16.875L7.5 13.9583C7.5 13.1529 6.84708 12.5 6.04167 12.5L3.125 12.5C2.77982 12.5 2.5 12.7798 2.5 13.125C2.5 13.4702 2.77982 13.75 3.125 13.75L6.04167 13.75C6.15672 13.75 6.25 13.8433 6.25 13.9583L6.25 16.875Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>

      </div>
    </>
  );
}
