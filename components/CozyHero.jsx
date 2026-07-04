"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import AccountMenu from "@/components/AccountMenu";

const ASSETS = {
  logo: "https://polo-pecan-73837341.figma.site/_assets/v11/0ae29d6d9628bede667f90d57bebe81b8f1ec2bf.svg",
  avatar:
    "https://polo-pecan-73837341.figma.site/_assets/v11/e62173d41f91350a59628e8a9a55ae078a886fb9.png?w=128",
  productCard: "/assets/pets/house1.avif",
  videoCard: "/assets/pets/dog2.avif",
  bottomLeft:
    "https://polo-pecan-73837341.figma.site/_assets/v11/8d44b25186ef45a5789c74668fb781cea4e1ff49.png",
  bottomCenter:
    "https://polo-pecan-73837341.figma.site/_assets/v11/96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024",
  bottomRight:
    "https://polo-pecan-73837341.figma.site/_assets/v11/81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png",
};

const POINTER_CURSOR = {
  cursor: "url('/assets/Cursor SVG/cursor-pointer.svg') 12 12, pointer",
};

/* ─── Inline Lucide icons (stroke-based, currentColor) ─── */
function IconSearch(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconCart(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
function IconStar({ filled, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconArrowUpRight(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}
function IconPlay(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
function IconArrowRight(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function IconPlus(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

/* ─── Shared overlay fragments ─── */
function StatOverlay({ className = "" }) {
  return (
    <div className={`cozy-stat ${className}`}>
      <div className="cozy-avatar-stack">
        <img src={ASSETS.avatar} alt="" />
        <span className="cozy-avatar-plus">
          <IconPlus />
        </span>
      </div>
      <span className="cozy-stat__value">98K+</span>
    </div>
  );
}

function RatingOverlay({ className = "" }) {
  return (
    <div className={`cozy-rating ${className}`}>
      <IconStar filled className="cozy-rating__star" />
      <span>4.6</span>
    </div>
  );
}

export default function CozyHero() {
  const heroRef = useRef(null);
  const router = useRouter();
  const { count: cartCount, openCart } = useCart();
  const { count: wishlistCount, openWishlist } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);

  const runSearch = (e) => {
    e.preventDefault();
    const term = e.currentTarget.elements.q.value.trim();
    setSearchOpen(false);
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  };

  // The site navbar is fixed (z-index 1000) and would sit on top of this
  // hero's own header — keep it hidden until the viewer scrolls past.
  useEffect(() => {
    const navbar = document.querySelector(".navbar");
    const hero = heroRef.current;
    if (!navbar || !hero) return;

    const onScroll = () => {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      navbar.classList.toggle(
        "is-cozy-hidden",
        window.scrollY < heroBottom - 100,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      navbar.classList.remove("is-cozy-hidden");
    };
  }, []);

  return (
    <section className="cozy-hero" ref={heroRef}>
      {/* ─── Header ─── */}
      <header className="cozy-header cozy-fade-in cozy-delay-100">
        <img src={ASSETS.logo} alt="CozyPaws" className="cozy-header__logo" />
        <nav className="cozy-header__nav">
          <a href="/" className="is-active" style={POINTER_CURSOR}>
            Home
          </a>
          <a href="/shop" style={POINTER_CURSOR}>
            Shop
          </a>
          <a href="/about" style={POINTER_CURSOR}>
            About
          </a>
          <a href="/contact" style={POINTER_CURSOR}>
            Contact
          </a>
        </nav>
        <div className="cozy-header__actions">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="cozy-icon-btn cozy-header__search"
            aria-label="Search"
            aria-expanded={searchOpen}
            style={POINTER_CURSOR}
          >
            <IconSearch className="cozy-icon" />
          </button>
          <button
            type="button"
            onClick={openWishlist}
            className="cozy-icon-btn cozy-icon-btn--orange"
            aria-label="Wishlist"
            style={POINTER_CURSOR}
          >
            <IconStar filled className="cozy-icon" />
            {wishlistCount > 0 && (
              <span className="cozy-badge">{wishlistCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={openCart}
            className="cozy-icon-btn"
            aria-label="Open cart"
            style={POINTER_CURSOR}
          >
            <IconCart className="cozy-icon" />
            {cartCount > 0 && <span className="cozy-badge">{cartCount}</span>}
          </button>
          <AccountMenu />
        </div>
      </header>

      {/* ─── Search overlay ─── */}
      {searchOpen && (
        <div
          className="cozy-search"
          role="dialog"
          aria-label="Search products"
          onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
        >
          <button
            className="cozy-search__backdrop"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          />
          <form className="cozy-search__bar" onSubmit={runSearch}>
            <IconSearch className="cozy-search__icon" />
            <input
              type="search"
              name="q"
              autoFocus
              placeholder="Search treats, toys, beds…"
              className="cozy-search__input"
            />
            <button
              type="submit"
              className="cozy-search__submit"
              style={POINTER_CURSOR}
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* ─── Desktop / tablet stage ─── */}
      <div className="cozy-hero__stage">
        <div className="cozy-hero__heading-wrap">
          <h1 className="cozy-hero__heading">
            <span className="cozy-hero__line">
              <span className="cozy-word cozy-delay-200">Everything</span>
            </span>
            <span className="cozy-hero__line">
              <span className="cozy-word cozy-delay-400">Your</span>{" "}
              <span className="cozy-word cozy-delay-500">Pets</span>{" "}
              <span className="cozy-word cozy-delay-600">Love</span>
            </span>
          </h1>
        </div>

        {/* Left product card */}
        <div className="cozy-card cozy-card--product cozy-slide-in-left cozy-delay-600">
          <div className="cozy-card__img-wrap">
            <img src={ASSETS.productCard} alt="Cozy Dog House" />
            <a
              href="/shop"
              className="cozy-card__arrow-btn"
              aria-label="View product"
              style={POINTER_CURSOR}
            >
              <IconArrowUpRight />
            </a>
          </div>
          <p className="cozy-card__name">Cozy Dog House</p>
          <p className="cozy-card__price">$49.99</p>
        </div>

        {/* Right video card */}
        <div className="cozy-card cozy-card--video cozy-slide-in-right cozy-delay-700">
          <div className="cozy-card__img-wrap cozy-card__img-wrap--video">
            <img src={ASSETS.videoCard} alt="Product review videos" />
            <div className="cozy-card__video-overlay">
              <button
                className="cozy-play-btn"
                aria-label="Play video"
                style={POINTER_CURSOR}
              >
                <IconPlay />
              </button>
              <p>Watch Product Reviews on TikTok and YouTube</p>
            </div>
          </div>
        </div>

        {/* Bottom photos */}
        <div className="cozy-photos">
          <div className="cozy-photos__item cozy-photos__item--side cozy-photo-reveal cozy-delay-700">
            <img src={ASSETS.bottomLeft} alt="Happy dog" />
            <div className="cozy-overlay cozy-overlay--side cozy-scale-in cozy-delay-1000">
              <StatOverlay />
            </div>
          </div>
          <div className="cozy-photos__item cozy-photos__item--center cozy-photo-reveal cozy-delay-600">
            <img src={ASSETS.bottomCenter} alt="Dog with owner" />
            <div className="cozy-overlay cozy-fade-up cozy-delay-1100">
              <h2 className="cozy-overlay__heading">
                Best Products for Your Pet
              </h2>
              <a
                href="/shop"
                className="cozy-btn-orange"
                style={POINTER_CURSOR}
              >
                Explore Products{" "}
                <IconArrowRight className="cozy-btn-orange__icon" />
              </a>
            </div>
          </div>
          <div className="cozy-photos__item cozy-photos__item--side cozy-photo-reveal cozy-delay-900">
            <img src={ASSETS.bottomRight} alt="Playful dog" />
            <div className="cozy-overlay cozy-overlay--side cozy-scale-in cozy-delay-1200">
              <RatingOverlay />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile layout ─── */}
      <div className="cozy-mobile">
        <div className="cozy-mobile__top">
          <h1 className="cozy-mobile__title cozy-fade-up cozy-delay-200">
            Everything Your Pets Love
          </h1>
          <p className="cozy-mobile__subtitle cozy-fade-up cozy-delay-300">
            Toys, treats and cozy essentials for your best friend.
          </p>
          <a
            href="/shop"
            className="cozy-btn-orange cozy-fade-up cozy-delay-400"
            style={POINTER_CURSOR}
          >
            Explore Products{" "}
            <IconArrowRight className="cozy-btn-orange__icon" />
          </a>
        </div>

        <div className="cozy-mobile__cards">
          <div className="cozy-mcard cozy-scale-in cozy-delay-500">
            <div className="cozy-card__img-wrap cozy-mcard__img--square">
              <img src={ASSETS.productCard} alt="Cozy Dog House" />
              <a
                href="/shop"
                className="cozy-card__arrow-btn"
                aria-label="View product"
                style={POINTER_CURSOR}
              >
                <IconArrowUpRight />
              </a>
            </div>
            <p className="cozy-card__name">Cozy Dog House</p>
            <p className="cozy-card__price">$49.99</p>
          </div>
          <div className="cozy-mcard cozy-scale-in cozy-delay-600">
            <div className="cozy-card__img-wrap cozy-mcard__img--tall">
              <img src={ASSETS.videoCard} alt="Product review videos" />
              <div className="cozy-card__video-overlay">
                <button
                  className="cozy-play-btn"
                  aria-label="Play video"
                  style={POINTER_CURSOR}
                >
                  <IconPlay />
                </button>
                <p>Watch Product Reviews on TikTok and YouTube</p>
              </div>
            </div>
          </div>
        </div>

        <div className="cozy-mobile__stats cozy-fade-in cozy-delay-700">
          <StatOverlay className="cozy-stat--on-light" />
          <span className="cozy-mobile__divider" />
          <RatingOverlay className="cozy-rating--on-light" />
        </div>

        <div className="cozy-photos cozy-photos--mobile">
          <div className="cozy-photos__item cozy-photos__item--side cozy-photo-reveal cozy-delay-700">
            <img src={ASSETS.bottomLeft} alt="Happy dog" />
          </div>
          <div className="cozy-photos__item cozy-photos__item--center cozy-photo-reveal cozy-delay-600">
            <img src={ASSETS.bottomCenter} alt="Dog with owner" />
          </div>
          <div className="cozy-photos__item cozy-photos__item--side cozy-photo-reveal cozy-delay-800">
            <img src={ASSETS.bottomRight} alt="Playful dog" />
          </div>
        </div>
      </div>
    </section>
  );
}
