"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CARDS_DATA } from "@/lib/data";
import { CATEGORY_ACCENT, PRODUCTS } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { formatPrice } from "@/lib/money";
import { flyToCart } from "@/lib/fly-to-cart";
import { usePop } from "@/lib/hooks/usePop";
import { isModifiedClick, navigateWithTransition } from "@/lib/view-transition";
import type { Category, Product } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import SmartImage from "@/components/SmartImage";
import SiteFooter from "@/components/SiteFooter";
import { IconPlus, IconMinus, IconArrowUpRight, IconArrowRight, IconStar } from "@/components/icons";
import QtyNumber from "@/components/QtyNumber";

type Filter = "all" | Category;
const CATEGORIES: Filter[] = ["all", ...CARDS_DATA.map((card) => card.title as Category)];
const URL_SYNC_DELAY_MS = 250;
// White text fails contrast on the lighter accents.
const CATEGORY_TEXT: Partial<Record<Category, string>> = {
  "comfy beds": "var(--color-black)",
  "grooming & care": "var(--color-black)",
};

type SortKey = "featured" | "popular" | "price-asc" | "price-desc" | "new";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "featured" },
  { key: "popular", label: "most popular" },
  { key: "price-asc", label: "price: low to high" },
  { key: "price-desc", label: "price: high to low" },
  { key: "new", label: "newest" },
];

function sortProducts(list: readonly Product[], sort: SortKey): readonly Product[] {
  const copy = [...list];
  switch (sort) {
    case "popular":
      return copy.sort((a, b) => b.popularity - a.popularity);
    case "price-asc":
      return copy.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return copy.sort((a, b) => b.priceCents - a.priceCents);
    case "new":
      return copy.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || b.popularity - a.popularity);
    default:
      return list;
  }
}

// One photo per category tile: the category's most popular product.
const TILE_IMAGE: Record<Category, string> = Object.fromEntries(
  (CARDS_DATA.map((c) => c.title) as Category[]).map((cat) => [
    cat,
    [...PRODUCTS].filter((p) => p.category === cat).sort((a, b) => b.popularity - a.popularity)[0]?.img ?? "",
  ]),
) as Record<Category, string>;
const COUNT: Record<Filter, number> = Object.fromEntries(
  CATEGORIES.map((c) => [c, c === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c).length]),
) as Record<Filter, number>;

// The "first dinner kit" merchandising card adds these in one tap.
const DINNER_KIT = ["ceramic-slow-bowl", "superfood-kibble", "peanut-butter-bites"];

/** Wraps each case-insensitive match of `query` in <mark>. */
function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: ReactNode[] = [];
  let from = 0;
  let at = lower.indexOf(q, from);
  while (at !== -1) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(<mark key={at}>{text.slice(at, at + q.length)}</mark>);
    from = at + q.length;
    at = lower.indexOf(q, from);
  }
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}

/*
 * Search decision: the catalog is local, so filtering happens on the client
 * with no network request (and so no AbortController or race handling is
 * needed). useDeferredValue keeps typing responsive by letting React render
 * the filtered grid at lower priority. The URL is updated with replace() on a
 * short debounce, so results are shareable without flooding browser history.
 * With a server-side catalog I'd debounce the fetch and abort stale requests.
 */
export default function ShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category");

  const [term, setTerm] = useState(urlQuery);
  // Category lives in the URL, so a filtered view can be shared or bookmarked.
  const activeCategory: Filter = CATEGORIES.includes(urlCategory as Filter)
    ? (urlCategory as Filter)
    : "all";
  const setActiveCategory = (category: Filter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") params.delete("category");
    else params.set("category", category);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const urlSort = searchParams.get("sort");
  const sort: SortKey = SORTS.some((o) => o.key === urlSort) ? (urlSort as SortKey) : "featured";
  const setSort = (next: SortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "featured") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const deferredTerm = useDeferredValue(term);
  const query = deferredTerm.trim();
  const isStale = term.trim() !== query;

  const inputRef = useRef<HTMLInputElement>(null);
  const lastSyncedQuery = useRef(urlQuery);

  const { addItem, setQty, openCart, items, cartTargetRef } = useCart();
  const { has: isSaved, toggle: toggleSaved } = useWishlist();
  const [popping, pop] = usePop();
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollReveal(pageRef, [activeCategory, query]);

  // Sliding filter highlight: measure the active pill (it can wrap onto a
  // new row on small screens) and move one indicator to it.
  const filtersRef = useRef<HTMLElement>(null);
  const pillRefs = useRef<Partial<Record<Filter, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState<{ x: number; y: number; w: number; h: number; animate: boolean } | null>(null);
  const activeAccent = activeCategory === "all" ? "var(--flow-ink)" : CATEGORY_ACCENT[activeCategory];
  useEffect(() => {
    const container = filtersRef.current;
    if (!container) return;
    const measure = (animate: boolean) => {
      const pill = pillRefs.current[activeCategory];
      if (!pill) return;
      setIndicator({ x: pill.offsetLeft, y: pill.offsetTop, w: pill.offsetWidth, h: pill.offsetHeight, animate });
    };
    measure(indicator !== null);
    // Re-measure without animating when the layout reflows (resize, font load).
    const observer = new ResizeObserver(() => measure(false));
    observer.observe(container);
    return () => observer.disconnect();
    // Only re-run when the active category changes.
  }, [activeCategory]);

  // URL → input, e.g. when the hero search navigates here with ?q=
  useEffect(() => {
    if (urlQuery !== lastSyncedQuery.current) {
      lastSyncedQuery.current = urlQuery;
      setTerm(urlQuery);
    }
  }, [urlQuery]);

  // input → URL, debounced
  useEffect(() => {
    const next = term.trim();
    if (next === lastSyncedQuery.current) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      lastSyncedQuery.current = next;
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, URL_SYNC_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [term, pathname, router, searchParams]);

  // "/" focuses search from anywhere on the page (like GitHub, Linear, etc.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleProducts = useMemo(() => {
    const byCategory =
      activeCategory === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCategory);
    const q = query.toLowerCase();
    const matched = q
      ? byCategory.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      : byCategory;
    return sortProducts(matched, sort);
  }, [activeCategory, query, sort]);

  const qtyInCart = (id: string) => items.find((line) => line.id === id)?.qty ?? 0;

  // Card → product: the photo morphs into the product page's photo.
  const openProduct = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (isModifiedClick(e)) return; // let cmd/ctrl-click open a new tab
    const photo = e.currentTarget.closest("article")?.querySelector("img") ?? null;
    const handled = navigateWithTransition(() => router.push(`/shop/${id}`), {
      element: photo,
      name: "product-image",
    });
    if (handled) e.preventDefault();
  };

  const handleAdd = (id: string, button: HTMLElement) => {
    addItem(id);
    // Fly the card's own photo (found from the clicked card, not the document).
    const photo = button.closest("article")?.querySelector("img") ?? null;
    void flyToCart(photo, cartTargetRef.current).then(openCart);
  };

  const addDinnerKit = () => {
    DINNER_KIT.forEach((id) => {
      if (qtyInCart(id) === 0) addItem(id);
    });
    openCart();
  };

  const resultLabel = `${visibleProducts.length} product${visibleProducts.length === 1 ? "" : "s"}${
    query ? ` for “${query}”` : ""
  }`;

  // Merchandising cards only in the default, unfiltered view.
  const showMerch = activeCategory === "all" && !query && sort === "featured";

  const renderCard = (product: Product) => {
    const saved = isSaved(product.id);
    const inCart = qtyInCart(product.id);
    const maxedOut = inCart >= product.stock;
    return (
      <article
        key={product.id}
        className="shop-card"
        data-reveal
        data-has-alt={product.img2 ? "" : undefined}
        style={{ "--accent": CATEGORY_ACCENT[product.category] } as CSSProperties}
      >
        <Link
          href={`/shop/${product.id}`}
          className="shop-card__img-wrap img-slot"
          aria-label={product.name}
          onClick={(e) => openProduct(e, product.id)}
        >
          <SmartImage
            src={product.img}
            alt=""
            loading="lazy"
            width={800}
            height={800}
            sizes="(max-width: 599px) 50vw, (max-width: 1100px) 33vw, 320px"
          />
          {product.img2 && (
            <SmartImage
              src={product.img2}
              alt=""
              loading="lazy"
              width={800}
              height={800}
              className="shop-card__img2"
              sizes="(max-width: 599px) 50vw, (max-width: 1100px) 33vw, 320px"
            />
          )}
          {product.badge && <span className="shop-card__badge">{product.badge}</span>}
          {product.approved && (
            <span className="shop-card__stamp" title="Passed the Biscuit test">
              biscuit-approved
            </span>
          )}
          <span className="shop-card__view" aria-hidden="true">
            <IconArrowUpRight />
          </span>
        </Link>
        <button
          type="button"
          className={`shop-card__fav ${saved ? "is-saved" : ""}`}
          data-pop={popping === product.id || undefined}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          onClick={() => {
            if (!saved) pop(product.id);
            toggleSaved(product.id);
          }}
        >
          <IconStar fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="shop-card__info">
          <div>
            <Link href={`/shop/${product.id}`} className="shop-card__name" onClick={(e) => openProduct(e, product.id)}>
              {highlight(product.name, query)}
            </Link>
            <p className="shop-card__category">{product.category}</p>
          </div>
          <p className="shop-card__price">{formatPrice(product.priceCents)}</p>
        </div>
        {inCart > 0 ? (
          // Already in the cart: change the amount right here.
          <div className="shop-card__stepper" data-inp="cart-stepper" role="group" aria-label={`${product.name} in cart`}>
            <button
              type="button"
              aria-label={`Remove one ${product.name}`}
              onClick={() => setQty(product.id, inCart - 1)}
            >
              <IconMinus />
            </button>
            <span className="shop-card__stepper-qty">
              <QtyNumber value={inCart} /> in cart
            </span>
            <button
              type="button"
              aria-label={`Add one more ${product.name}`}
              disabled={maxedOut}
              onClick={() => setQty(product.id, inCart + 1)}
            >
              <IconPlus />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="shop-card__add"
            onClick={(e) => handleAdd(product.id, e.currentTarget)}
            disabled={product.stock === 0}
          >
            <IconPlus className="shop-card__add-icon" /> add to cart
          </button>
        )}
      </article>
    );
  };

  const kitTotal = DINNER_KIT.reduce((sum, id) => sum + (PRODUCTS.find((p) => p.id === id)?.priceCents ?? 0), 0);
  const merchCards: Record<number, ReactNode> = {
    4: (
      <aside key="kit" className="merch-card merch-card--kit" data-reveal aria-labelledby="kit-title">
        <img src="/assets/Card-Sticker SVG/sticker-heart.svg" alt="" aria-hidden="true" className="merch-card__sticker" />
        <p className="merch-card__eyebrow">the first dinner kit</p>
        <h2 id="kit-title" className="merch-card__title">
          bowl, kibble <em>&amp; a treat</em>
        </h2>
        <p className="merch-card__body">
          Everything for a new pup&apos;s first dinner: the ceramic slow bowl, superfood kibble and a bag of peanut
          butter bites.
        </p>
        <button type="button" className="merch-card__btn" onClick={addDinnerKit}>
          add all three · {formatPrice(kitTotal)} <IconArrowRight />
        </button>
      </aside>
    ),
    10: (
      <aside key="pick" className="merch-card merch-card--pick" data-reveal aria-label="Staff pick">
        <p className="merch-card__eyebrow">staff pick</p>
        <blockquote className="merch-card__quote">
          “I&apos;ve destroyed 214 toys. This rope is still here.”
        </blockquote>
        <p className="merch-card__cite">Biscuit, chief tester</p>
        <Link href="/shop/rope-tug-bundle" className="merch-card__link">
          see the rope tug bundle <IconArrowUpRight />
        </Link>
      </aside>
    ),
  };

  return (
    <div className="shop-page cozy-page" ref={pageRef}>
      <SiteHeader />

      <section className="shop-hero shop-hero--v2">
        <span className="story-eyebrow cozy-fade-up cozy-delay-100">🐾 the good stuff</span>
        <h1 className="story-title cozy-fade-up cozy-delay-200">
          everything your dog <em>loves</em>
          <img
            className="story-title__sticker"
            src="/assets/Footer-Sticker SVG/footer-sticker-heart.svg"
            alt=""
            aria-hidden="true"
          />
        </h1>
        <p className="shop-hero__subtitle cozy-fade-up cozy-delay-300">
          Toys, treats, cozy beds and more. Every one picked by dogs, and most of them Biscuit-tested.
        </p>
      </section>

      <nav
        ref={filtersRef}
        className="shop-filters shop-cats cozy-fade-up cozy-delay-300"
        aria-label="Product categories"
        data-indicator={indicator ? "" : undefined}
      >
        {/* One ring that slides to the active tile instead of jumping. */}
        {indicator && (
          <span
            className="shop-filters__indicator"
            aria-hidden="true"
            data-animate={indicator.animate || undefined}
            style={{
              transform: `translate(${indicator.x}px, ${indicator.y}px)`,
              width: indicator.w,
              height: indicator.h,
              color: activeAccent,
            }}
          />
        )}
        {CATEGORIES.map((category) => {
          const active = category === activeCategory;
          const accent = category !== "all" ? CATEGORY_ACCENT[category] : "var(--color-dark)";
          return (
            <button
              key={category}
              ref={(node) => {
                pillRefs.current[category] = node;
              }}
              type="button"
              aria-pressed={active}
              className="cat-tile"
              data-active={active || undefined}
              style={{ "--accent": accent, "--tile-ink": category !== "all" ? CATEGORY_TEXT[category] ?? "#fff" : "#fff" } as CSSProperties}
              onClick={() => setActiveCategory(category)}
            >
              <span className="cat-tile__img" aria-hidden="true">
                {category === "all" ? (
                  <img src="/assets/pets/paw-sticker.svg" alt="" />
                ) : (
                  <SmartImage src={TILE_IMAGE[category]} alt="" width={200} height={200} sizes="72px" loading="lazy" />
                )}
              </span>
              <span className="cat-tile__name">{category === "all" ? "shop all" : category}</span>
              <span className="cat-tile__count" aria-hidden="true">
                {COUNT[category]}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="shop-toolbar">
        <search className="shop-search" data-inp="search">
          <label htmlFor="shop-search-input" className="visually-hidden">
            Search products
          </label>
          <input
            ref={inputRef}
            id="shop-search-input"
            type="search"
            value={term}
            placeholder="Search toys, treats, beds…"
            autoComplete="off"
            aria-describedby="shop-search-hint"
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && term) {
                e.preventDefault();
                setTerm("");
              }
            }}
          />
          <kbd id="shop-search-hint" className="shop-search__kbd" aria-label="Press slash to search">
            /
          </kbd>
        </search>

        <div className="shop-search-status">
          <p role="status" aria-live="polite">
            {resultLabel}
          </p>
          {term && (
            <button type="button" className="shop-search-clear" onClick={() => setTerm("")}>
              clear search
            </button>
          )}
        </div>

        <label className="shop-sort">
          <span>sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {SORTS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="shop-empty">
          <img src="/assets/pets/paw-sticker.svg" alt="" aria-hidden="true" />
          <h2>No products found</h2>
          <p>We couldn&apos;t sniff out anything for that search. Try another term or browse everything.</p>
          <button
            type="button"
            className="cozy-btn-orange"
            onClick={() => {
              setTerm("");
              setActiveCategory("all");
            }}
          >
            browse all products
          </button>
        </div>
      ) : (
        <section className="shop-grid" aria-label="Products" data-stale={isStale || undefined}>
          {visibleProducts.flatMap((product, i) => {
            const card = renderCard(product);
            const merch = showMerch ? merchCards[i] : undefined;
            return merch ? [merch, card] : [card];
          })}
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
