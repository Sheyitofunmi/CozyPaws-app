"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";
import { initWiggle } from "@/lib/wiggle";
import { WIGGLE_CONFIG } from "@/lib/data";
import { useHomeSections } from "@/lib/home-sections";
import MobileNav from "@/components/MobileNav";
import SmartImage from "@/components/SmartImage";

const POINTER_CURSOR = { cursor: "url('/assets/Cursor SVG/cursor-pointer.svg') 12 12, pointer" };

/** Scale-in pop-out anchored on its trigger icon, with a staggered list and a shared dim overlay. */
function initPopout(
  trigger: HTMLElement,
  box: HTMLElement,
  anchor: Element | null,
  overlay: HTMLElement | null,
  extra: { enter?: () => void; leave?: () => void } = {},
): () => void {
  const items = Array.from(box.querySelector(".nav-popout-inner")?.children ?? []);

  // Measure the open box once to put the transform origin on the icon.
  gsap.set(box, { visibility: "visible", scale: 1, opacity: 1 });
  const boxRect = box.getBoundingClientRect();
  const iconRect = anchor?.getBoundingClientRect() ?? boxRect;
  const origin = `${iconRect.left + iconRect.width / 2 - boxRect.left}px ${iconRect.top + iconRect.height / 2 - boxRect.top}px`;
  gsap.set(box, { visibility: "hidden", scale: 0, opacity: 0, transformOrigin: origin });
  gsap.set(items, { y: 10, opacity: 0 });

  const onEnter = () => {
    gsap.killTweensOf([box, ...items]);
    if (overlay) {
      gsap.set(overlay, { visibility: "visible" });
      gsap.to(overlay, { opacity: 1, duration: 0.35, ease: "power2.out" });
    }
    extra.enter?.();
    gsap.set(box, { visibility: "visible" });
    gsap.fromTo(box, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" });
    gsap.to(items, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out", delay: 0.18 });
  };
  const onLeave = () => {
    gsap.killTweensOf([box, ...items]);
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => void gsap.set(overlay, { visibility: "hidden" }),
      });
    }
    extra.leave?.();
    gsap.to(items, { y: 10, opacity: 0, duration: 0.15, ease: "power2.in" });
    gsap.to(box, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: "expo.in",
      delay: 0.05,
      onComplete: () => void gsap.set(box, { visibility: "hidden" }),
    });
  };
  trigger.addEventListener("mouseenter", onEnter);
  trigger.addEventListener("mouseleave", onLeave);
  return () => {
    trigger.removeEventListener("mouseenter", onEnter);
    trigger.removeEventListener("mouseleave", onLeave);
  };
}

/** Stepped hover wiggle on a child plus an optional tween, undone on leave. */
function onHover(el: Element, enter: () => (() => void) | void): () => void {
  let undo: (() => void) | void;
  const onEnter = () => {
    if (!prefersReducedMotion()) undo = enter();
  };
  const onLeave = () => {
    undo?.();
    undo = undefined;
  };
  el.addEventListener("mouseenter", onEnter);
  el.addEventListener("mouseleave", onLeave);
  return () => {
    el.removeEventListener("mouseenter", onEnter);
    el.removeEventListener("mouseleave", onLeave);
  };
}

export default function Navbar() {
  const sections = useHomeSections();
  const navRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const navLeftRef = useRef<HTMLDivElement>(null);
  const workBoxRef = useRef<HTMLDivElement>(null);
  const workBlobRef = useRef<HTMLImageElement>(null);
  const navRightRef = useRef<HTMLDivElement>(null);
  const waBoxRef = useRef<HTMLDivElement>(null);
  const waIconRef = useRef<SVGSVGElement>(null);
  const localLogoRef = useRef<SVGSVGElement>(null);
  const logoRef = sections?.logo ?? localLogoRef;

  useEffect(() => {
    const navbar = navRef.current;
    if (!navbar) return;
    navbar.classList.add("on-dark");
    navbar.classList.remove("on-light");

    // Section boundaries are measured once (and again on resize / after
    // ScrollTrigger adds pin space), not on every scroll event: reading
    // getBoundingClientRect in a scroll handler forces layout each frame.
    let tops = { content: Infinity, service: Infinity, marquee: Infinity, footer: Infinity };
    const topOf = (el: Element | null | undefined) =>
      el ? el.getBoundingClientRect().top + window.scrollY : Infinity;

    let lastY = window.scrollY;
    const updateNavbar = () => {
      const y = window.scrollY;
      const scrollPos = y + navbar.offsetHeight / 2;
      const onLight =
        scrollPos < tops.footer &&
        (scrollPos >= tops.marquee || scrollPos >= tops.service || scrollPos >= tops.content);
      navbar.classList.toggle("on-light", onLight);
      navbar.classList.toggle("on-dark", !onLight);

      // Get out of the way while reading down; come back as soon as the
      // visitor scrolls up (or is using the navbar / its pop-outs).
      const delta = y - lastY;
      lastY = y;
      const busy = navbar.matches(":hover, :focus-within");
      if (y < window.innerHeight * 0.6 || delta < -6 || busy) navbar.classList.remove("is-away");
      else if (delta > 8) navbar.classList.add("is-away");
      // A soft backdrop once content scrolls underneath, so labels stay readable.
      navbar.classList.toggle("is-scrolled", y > 40);
    };
    const measure = () => {
      tops = {
        content: topOf(sections?.firstLight.current),
        service: topOf(sections?.services.current),
        marquee: topOf(sections?.marquee.current),
        footer: topOf(sections?.footer.current),
      };
      updateNavbar();
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        updateNavbar();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    ScrollTrigger.addEventListener("refresh", measure);
    measure();

    const cleanups: (() => void)[] = [];
    if (logoRef.current) cleanups.push(initWiggle(logoRef.current, WIGGLE_CONFIG.cozyLogo));

    const overlay = overlayRef.current;
    if (overlay) gsap.set(overlay, { opacity: 0, visibility: "hidden" });

    const workBlob = workBlobRef.current;
    if (navLeftRef.current && workBoxRef.current && workBlob) {
      gsap.set(workBlob, { transformOrigin: "center center" });
      cleanups.push(
        initPopout(navLeftRef.current, workBoxRef.current, workBlob, overlay, {
          enter: () => {
            gsap.killTweensOf(workBlob);
            gsap.to(workBlob, { rotation: "+=360", duration: 0.7, ease: "power3.inOut" });
          },
          leave: () => {
            gsap.killTweensOf(workBlob);
            gsap.to(workBlob, { rotation: 0, duration: 0.5, ease: "power2.out" });
          },
        }),
      );
    }

    const waIcon = waIconRef.current;
    const waPath = waIcon?.querySelector("path");
    if (navRightRef.current && waBoxRef.current) {
      cleanups.push(
        initPopout(navRightRef.current, waBoxRef.current, waIcon, overlay, {
          enter: () => void (waPath && gsap.to(waPath, { fill: "#0e6634ff", duration: 0.3 })), // darker WA green
          leave: () => void (waPath && gsap.to(waPath, { fill: "currentColor", duration: 0.3 })),
        }),
      );
    }

    // Product rows and the "shop all" button in the shop pop-out.
    const workBox = workBoxRef.current;
    workBox?.querySelectorAll<HTMLElement>(".nav-work-item").forEach((item) => {
      const badge = item.querySelector(".nav-work-badge");
      const img = item.querySelector(".nav-work-item__img");
      cleanups.push(
        onHover(item, () => {
          const wiggle = badge
            ? gsap.to(badge, { rotation: 5, duration: 0.15, repeat: -1, yoyo: true, ease: "steps(1)", transformOrigin: "center center" })
            : undefined;
          if (img) gsap.to(img, { rotation: 16, scale: 1.15, duration: 0.25, ease: "power2.out" });
          return () => {
            wiggle?.kill();
            if (badge) gsap.to(badge, { rotation: 0, duration: 0.3, ease: "power2.out" });
            if (img) gsap.to(img, { rotation: 0, scale: 1, duration: 0.3, ease: "power2.out" });
          };
        }),
      );
    });
    const workBtn = workBox?.querySelector(".nav-work-btn");
    const btnText = workBtn?.querySelector(".nav-work-btn__text");
    if (workBtn && btnText) {
      cleanups.push(
        onHover(workBtn, () => {
          gsap.set(btnText, { transformOrigin: "center center", display: "inline-block" });
          const wiggle = gsap.to(btnText, { rotation: 4, duration: 0.12, repeat: -1, yoyo: true, ease: "steps(1)" });
          return () => {
            wiggle.kill();
            gsap.to(btnText, { rotation: 0, duration: 0.3, ease: "power2.out" });
          };
        }),
      );
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ScrollTrigger.removeEventListener("refresh", measure);
      cleanups.forEach((fn) => fn());
    };
  }, [sections, logoRef]);

  return (
    <>
      <div ref={overlayRef} className="nav-overlay"></div>
      <nav ref={navRef} className="navbar">
        <div ref={navLeftRef} className="nav-left" style={POINTER_CURSOR}>
          <div className="nav-hover-trigger">
            <div className="logo-work-container">
              <img
                ref={workBlobRef}
                src="/assets/Navbar SVG/nav-work-blob.svg"
                width="60"
                height="55"
                className="nav-bar__work-blob-svg"
                alt=""
                aria-hidden="true"
              />
              <span className="logo-work-text">shop</span>
            </div>

            <div ref={workBoxRef} className="nav-popout nav-work-box">
              <div className="nav-popout-inner">
                <div className="nav-work-item">
                  <div className="nav-work-item__img-wrap">
                    <SmartImage
                      src="/assets/pets/house1.avif"
                      loading="lazy"
                      width={900}
                      height={1350}
                      sizes="96px"
                      alt="Cozy dog house"
                      className="nav-work-item__img"
                    />
                  </div>
                  <div className="nav-work-item__text">
                    <span className="nav-work-badge badge-maroon">
                      bestseller
                    </span>
                    <h4 className="nav-work-title">cozy dog house</h4>
                  </div>
                </div>
                <div className="nav-work-item">
                  <div className="nav-work-item__img-wrap">
                    <SmartImage
                      src="/assets/products/rope-tug-bundle.jpg"
                      loading="lazy"
                      width={900}
                      height={900}
                      sizes="96px"
                      alt="Rope tug bundle"
                      className="nav-work-item__img"
                    />
                  </div>
                  <div className="nav-work-item__text">
                    <span className="nav-work-badge badge-pink">
                      toys &amp; play
                    </span>
                    <h4 className="nav-work-title">rope tug bundle</h4>
                  </div>
                </div>
                <div className="nav-work-item">
                  <div className="nav-work-item__img-wrap">
                    <SmartImage
                      src="/assets/products/peanut-butter-bites.jpg"
                      loading="lazy"
                      width={900}
                      height={900}
                      sizes="96px"
                      alt="Peanut butter bites"
                      className="nav-work-item__img"
                    />
                  </div>
                  <div className="nav-work-item__text">
                    <span className="nav-work-badge badge-pink">treats</span>
                    <h4 className="nav-work-title">peanut butter bites</h4>
                  </div>
                </div>
                <a href="/shop" className="nav-work-btn">
                  <span className="nav-work-btn__text">Shop all products</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="nav-center" style={POINTER_CURSOR}>
          <svg
            ref={logoRef}
            className="cozy-logo"
            width="150"
            height="40"
            viewBox="0 0 170 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="currentColor">
              <ellipse
                cx="7"
                cy="18"
                rx="3.4"
                ry="4.6"
                transform="rotate(-25 7 18)"
              />
              <ellipse
                cx="14.5"
                cy="12.5"
                rx="3.6"
                ry="5"
                transform="rotate(-8 14.5 12.5)"
              />
              <ellipse
                cx="23.5"
                cy="12.5"
                rx="3.6"
                ry="5"
                transform="rotate(8 23.5 12.5)"
              />
              <ellipse
                cx="31"
                cy="18"
                rx="3.4"
                ry="4.6"
                transform="rotate(25 31 18)"
              />
              <path d="M19 20c-5.6 0-10.5 4.5-10.5 9.6 0 3.4 2.6 5.4 5.5 5.4 1.9 0 3.4-.8 5-.8s3.1.8 5 .8c2.9 0 5.5-2 5.5-5.4C29.5 24.5 24.6 20 19 20z" />
              <text
                x="40"
                y="29"
                fontFamily="Epilogue, sans-serif"
                fontWeight="800"
                fontSize="25"
                letterSpacing="-0.5"
              >
                CozyPaws
              </text>
            </g>
          </svg>
        </div>
        <div ref={navRightRef} className="nav-right" style={POINTER_CURSOR}>
          <div className="nav-hover-trigger">
            <div className="logo-whatsapp">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 25 27"
                fill="none"
                className="nav-bar__whatsapp-svg"
                ref={waIconRef}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.601 0.986335C11.8021 1.01421 11.8112 1.04366 12.0483 1.04591C12.4513 1.04943 12.8582 1.03181 13.2602 1.04591C14.7297 1.09749 16.3092 1.56281 17.684 2.0713C18.1173 2.2315 18.4074 2.52491 18.7836 2.75782C18.9541 2.86323 19.1764 2.93811 19.3335 3.03712C19.5277 3.15943 19.7215 3.30714 19.9233 3.43555C20.3796 3.7252 20.7523 4.04895 21.1381 4.42383C21.197 4.48126 21.2369 4.59395 21.2729 4.62403C21.314 4.65863 21.388 4.65528 21.4399 4.6963C21.7068 4.90722 22.4207 5.74735 22.6147 6.04298C22.7185 6.20149 22.7985 6.47832 22.9067 6.61329C23.0415 6.7815 23.1644 6.86231 23.2963 7.08692C23.7885 7.92434 24.1902 8.84837 24.4702 9.7793C24.6279 10.304 24.8111 10.9219 24.8608 11.4668C24.9707 12.6708 25.0812 13.7784 24.9155 14.9785C24.8495 15.4578 24.7632 15.9691 24.6469 16.4365C24.4028 17.4173 23.9978 18.3669 23.5952 19.3125L23.5942 19.3154C23.2319 20.1653 22.4331 20.9908 21.8686 21.71C21.6788 21.9518 21.5246 22.1892 21.2797 22.3965C21.0348 22.6037 20.7282 22.768 20.4858 22.9746C20.3515 23.0889 20.2324 23.2615 20.0844 23.3711C19.9297 23.4854 19.7093 23.5536 19.5795 23.6641C18.8674 24.2709 18.4307 24.4852 17.5708 24.8457C16.3894 25.341 15.3983 25.5527 14.143 25.8154C14.0198 25.8414 13.6705 25.8663 13.5473 25.8525C12.9146 25.7827 12.2271 25.9044 11.5727 25.8545C10.0414 25.7376 8.57578 25.2528 7.1401 24.7734C7.00809 24.7291 6.84411 24.5744 6.72701 24.5498C6.36124 24.4742 5.86748 24.7318 5.5151 24.8535C4.11582 25.337 2.69086 25.7679 1.29732 26.2774C1.16321 26.3264 1.01916 26.4488 0.862752 26.4805C0.562812 26.5413 0.382276 26.4893 0.175252 26.2725C-0.0110214 26.0774 -0.0238393 25.8442 0.0414625 25.5899C0.195974 24.988 0.457528 24.3357 0.623494 23.7432C0.689129 23.509 0.689327 23.2415 0.768025 22.9912C0.86868 22.6711 1.01713 22.3593 1.10885 22.0225C1.25986 21.4672 1.50066 20.9638 1.61568 20.3877C1.66507 20.1397 1.73727 19.8129 1.65474 19.5703C1.54703 19.2542 1.22105 18.8061 1.07857 18.4512C0.98014 18.2061 0.934053 17.924 0.84615 17.6924C0.795172 17.5578 0.685305 17.446 0.623494 17.3076C0.333338 16.6573 0.234002 15.75 0.137166 15.044C0.0291742 14.2597 -0.0144194 13.51 0.00435316 12.7207C0.00976743 12.4965 0.125735 12.263 0.156697 12.0391C0.225199 11.5469 0.215443 11.048 0.327595 10.5459C0.427657 10.0991 0.607537 9.65975 0.740681 9.23341C1.04177 8.26936 1.59197 7.3249 2.13326 6.47266C2.68319 5.60691 3.57311 4.75118 4.3276 4.06934C4.65535 3.77309 4.99265 3.53295 5.33345 3.25684C5.60926 3.03334 5.96284 2.93518 6.23677 2.75782C6.99243 2.26894 7.82882 1.80324 8.70553 1.52735C9.27166 1.34921 11.0774 0.914319 11.601 0.986335ZM8.61275 6.26563C8.24195 6.2935 7.52111 6.42855 7.19381 6.59864C7.0884 6.6534 7.03981 6.75373 6.9526 6.80469C6.77895 6.90626 6.5672 6.92775 6.35787 7.0713C5.53363 7.63716 5.10203 9.42643 5.26802 10.3643C5.304 10.5685 5.34605 10.781 5.38521 10.9824C5.4843 11.4925 5.65625 11.8143 5.77095 12.292C5.86034 12.6635 6.20472 13.0539 6.33052 13.4258C8.20336 16.9242 11.6057 19.8244 15.6147 20.3848C16.7183 20.42 17.5983 20.0958 18.5063 19.5127C18.9765 19.211 19.0117 18.9824 19.1938 18.5078C19.2868 18.2656 19.5158 18.014 19.5639 17.7266C19.5849 17.6004 19.5657 17.4844 19.5854 17.3643C19.6052 17.2441 19.6944 17.1274 19.7231 16.9902C19.7846 16.6955 19.8101 16.284 19.5297 16.0918C19.3912 15.9972 19.1379 15.9595 19.0063 15.8828C18.956 15.8537 18.9069 15.7462 18.8461 15.6914C18.5871 15.4585 18.1002 15.3976 17.7778 15.2607C17.3352 15.0726 16.4148 14.5509 15.9633 14.5606C15.9382 14.5622 15.5716 14.6637 15.5424 14.6758C15.3846 14.7418 15.0675 15.2811 14.976 15.4502C14.8888 15.611 14.7512 16.0087 14.6655 16.1143C14.3396 16.5154 13.5792 16.4394 13.1704 16.2139C12.3996 15.7887 11.4294 14.9649 10.8569 14.3145C10.5344 13.9479 9.89438 13.3129 9.76314 12.8535C9.62042 12.3534 9.57275 11.9847 9.94869 11.5781C10.159 11.351 10.6709 10.903 10.7944 10.6367C10.8861 10.4394 10.8788 10.1244 10.7983 9.92481C10.4411 9.04176 10.0609 8.17693 9.69478 7.28907C9.64899 7.17828 9.63771 7.05901 9.58931 6.94727C9.51318 6.77179 9.28563 6.52143 9.13717 6.41016C9.00243 6.30927 8.7781 6.25318 8.61275 6.26563Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>

            <div ref={waBoxRef} className="nav-popout nav-wa-box">
              <div className="nav-popout-inner">
                {/* 478KB PNG → resized on demand; lazy, since it lives in a hidden pop-out. */}
                <SmartImage
                  src="/assets/wa_qr_code.png"
                  loading="lazy"
                  width={640}
                  height={640}
                  sizes="200px"
                  className="nav-wa-qr"
                  alt="WhatsApp QR Code"
                />
                <h4 className="nav-wa-title">whatsapp us</h4>
                <p className="nav-wa-desc">
                  Questions about your pup? Scan the QR code to chat with us via
                  your smartphone.
                </p>
                <a href="#" className="nav-wa-link">
                  <span className="nav-wa-link-text">Chat via desktop</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 169 10"
                    fill="none"
                    className="draw-btn__svg nav-wa-link-svg"
                  >
                    <path
                      d="M1 6.5661C56.3941 3.06082 112.187 1.20095 168 0.999878"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.25"
                    />
                    <path
                      d="M32.1313 8.63371C68.2147 6.92799 104.462 6.13378 140.695 6.25107"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.25"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tap target for touch / small screens (hover popouts don't work there).
            Takes nav-right's place in the flex row so the logo stays centered. */}
        <MobileNav className="nav-burger--navbar" />
      </nav>
    </>
  );
}
