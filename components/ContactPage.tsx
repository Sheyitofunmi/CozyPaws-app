"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useScrollReveal } from "@/lib/useScrollReveal";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { IconArrowRight, IconArrowUpRight } from "@/components/icons";
import { SHOP, SPOTS, directionsUrl, openState, type OpenState, type Spot } from "@/lib/contact-places";

// The map library is big: it's only fetched once the map is near the screen.
const ContactMap = dynamic(() => import("@/components/ContactMap"), { ssr: false });

const TOPICS = [
  { id: "general", label: "General" },
  { id: "order", label: "My order" },
  { id: "product", label: "Product help" },
  { id: "wholesale", label: "Wholesale" },
  { id: "hi", label: "Say hi 👋" },
] as const;
type TopicId = (typeof TOPICS)[number]["id"];

const CONTACT_CARDS = [
  {
    sticker: "/assets/Card-Sticker SVG/sticker-heart.svg",
    title: "email us",
    detail: "hello@cozypaws.co",
    href: "mailto:hello@cozypaws.co",
    color: "var(--color-pink)",
    tilt: "-3deg",
  },
  {
    sticker: "/assets/Card-Sticker SVG/sticker-phone.svg",
    title: "order help",
    detail: "orders@cozypaws.co",
    href: "mailto:orders@cozypaws.co?subject=Order%20help",
    color: "var(--color-lightblue)",
    tilt: "2deg",
  },
  {
    sticker: "/assets/Card-Sticker SVG/sticker-smiley.svg",
    title: "visit the shop",
    detail: SHOP.address,
    href: "#visit",
    color: "var(--color-lightgreen)",
    tilt: "-1.5deg",
  },
];

type Errors = Partial<Record<"name" | "email" | "message" | "orderNumber" | "company" | "form", string>>;

/** "open now" / "closed · back Monday at 9am", in London time, live. */
function useOpenState(): OpenState | null {
  const [state, setState] = useState<OpenState | null>(null); // null on the server: no hydration mismatch
  useEffect(() => {
    const tick = () => setState(openState());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return state;
}

/** Mounts the map once its section is within ~400px of the screen. */
function useNearScreen<T extends Element>(margin = "400px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, margin]);
  return [ref, near] as const;
}

export default function ContactPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollReveal(pageRef);
  const open = useOpenState();

  const [topic, setTopic] = useState<TopicId>("general");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);

  // Free the preview's object URL when it's replaced or the page unmounts.
  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);

  // After a failed send, take the visitor to the first thing to fix (once
  // React has rendered the error state, so the field is marked invalid).
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (status === "error") formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [status, errors]);

  const [mapRef, mapNear] = useNearScreen<HTMLDivElement>();
  const [mapState, setMapState] = useState<"idle" | "ready" | "failed">("idle");
  const [focusSpot, setFocusSpot] = useState<Spot | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    const form = e.currentTarget;
    const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: field("name"),
          email: field("email"),
          message: field("message"),
          topic,
          orderNumber: topic === "order" ? field("orderNumber") : undefined,
          company: topic === "wholesale" ? field("company") : undefined,
          hasPhoto: topic === "hi" && Boolean(photo),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || { form: data.error || "Something went wrong." });
        setStatus("error");
        return;
      }
      setSuccessMsg(data.message);
      setStatus("success");
      form.reset();
      setTopic("general");
      setPhoto(null);
    } catch {
      setErrors({ form: "Network hiccup, please try again." });
      setStatus("error");
    }
  };

  const err = (key: keyof Errors) =>
    errors[key] ? (
      <span className="contact-error" id={`cf-${key}-error`}>
        {errors[key]}
      </span>
    ) : null;
  const invalid = (key: keyof Errors) =>
    errors[key] ? { "aria-invalid": true as const, "aria-describedby": `cf-${key}-error` } : {};

  return (
    <div className="cozy-page contact-page" ref={pageRef}>
      <SiteHeader />

      <section className="contact-hero">
        <span className="story-eyebrow cozy-fade-up cozy-delay-100">🐾 get in touch</span>
        <h1 className="story-title cozy-fade-up cozy-delay-200">
          let&apos;s talk <em>dogs</em>
          <img
            className="story-title__sticker"
            src="/assets/Footer-Sticker SVG/footer-sticker-hands.svg"
            alt=""
            aria-hidden="true"
          />
        </h1>
        <p className="contact-hero__subtitle cozy-fade-up cozy-delay-300">
          Question about an order, a product, or just want to send a photo of your dog? We&apos;re all
          ears (and floppy ones at that).
        </p>
        <p className="open-badge cozy-fade-up cozy-delay-400" data-open={open?.open} aria-live="polite">
          <span className="open-badge__dot" aria-hidden="true" />
          {open ? open.label : "checking if we're in…"}
        </p>
      </section>

      <section className="contact-body">
        <div className="contact-cards">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="sticker-card"
              data-reveal
              style={{ "--accent": card.color, "--tilt": card.tilt } as CSSProperties}
            >
              <img className="sticker-card__sticker" src={card.sticker} alt="" aria-hidden="true" />
              <span className="sticker-card__title">{card.title}</span>
              <span className="sticker-card__detail">{card.detail}</span>
              <IconArrowUpRight className="sticker-card__arrow" aria-hidden="true" />
            </a>
          ))}
          <p className="contact-hours" data-reveal>
            <strong>Hours:</strong> Mon–Fri, 9am–6pm London time. We reply within one business day.
          </p>
        </div>

        <div className="contact-form-wrap" data-reveal data-reveal-delay="0.1">
          {status === "success" ? (
            <div className="contact-success" role="status">
              <svg className="paw-stamp" viewBox="0 0 120 120" aria-hidden="true">
                <circle className="paw-stamp__ring" cx="60" cy="60" r="54" />
                <g className="paw-stamp__paw">
                  <ellipse cx="60" cy="72" rx="19" ry="16" />
                  <ellipse cx="36" cy="50" rx="8" ry="10" />
                  <ellipse cx="51" cy="37" rx="8" ry="10.5" />
                  <ellipse cx="69" cy="37" rx="8" ry="10.5" />
                  <ellipse cx="84" cy="50" rx="8" ry="10" />
                </g>
              </svg>
              <h2>message sent!</h2>
              <p>{successMsg}</p>
              <button className="cozy-btn-orange" onClick={() => setStatus("idle")}>
                send another
              </button>
            </div>
          ) : (
            <form ref={formRef} className="contact-form" onSubmit={onSubmit} noValidate>
              <div className="contact-field">
                <label htmlFor="cf-name">Your name</label>
                <input id="cf-name" name="name" type="text" autoComplete="name" {...invalid("name")} />
                {err("name")}
              </div>

              <div className="contact-field">
                <label htmlFor="cf-email">Email</label>
                <input id="cf-email" name="email" type="email" autoComplete="email" {...invalid("email")} />
                {err("email")}
              </div>

              <fieldset className="contact-field contact-field--topics">
                <legend>What&apos;s it about?</legend>
                <div className="contact-topics">
                  {TOPICS.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      className={`contact-topic ${topic === t.id ? "is-active" : ""}`}
                      aria-pressed={topic === t.id}
                      onClick={() => setTopic(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Extra fields slide in for the topics that need them. */}
              <div className="contact-extra" data-open={topic === "order" || undefined}>
                <div className="contact-extra__inner">
                  {topic === "order" && (
                    <div className="contact-field">
                      <label htmlFor="cf-order">Order number</label>
                      <input
                        id="cf-order"
                        name="orderNumber"
                        type="text"
                        autoCapitalize="characters"
                        spellCheck={false}
                        aria-invalid={errors.orderNumber ? true : undefined}
                        aria-describedby={errors.orderNumber ? "cf-order-hint cf-orderNumber-error" : "cf-order-hint"}
                      />
                      <span className="contact-hint" id="cf-order-hint">
                        It&apos;s on your receipt and starts with CP-
                      </span>
                      {err("orderNumber")}
                    </div>
                  )}
                </div>
              </div>

              <div className="contact-extra" data-open={topic === "wholesale" || undefined}>
                <div className="contact-extra__inner">
                  {topic === "wholesale" && (
                    <div className="contact-field">
                      <label htmlFor="cf-company">Shop or company name</label>
                      <input id="cf-company" name="company" type="text" autoComplete="organization" {...invalid("company")} />
                      {err("company")}
                    </div>
                  )}
                </div>
              </div>

              <div className="contact-extra" data-open={topic === "hi" || undefined}>
                <div className="contact-extra__inner">
                  {topic === "hi" && (
                    <div className="contact-field">
                      <span className="contact-label">Got a dog photo? (optional)</span>
                      <label className="photo-drop" data-has-photo={photo ? "" : undefined}>
                        <input
                          type="file"
                          accept="image/*"
                          className="visually-hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setPhoto({ url: URL.createObjectURL(file), name: file.name });
                          }}
                        />
                        {photo ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt={`Your photo: ${photo.name}`} className="photo-drop__preview" />
                            <span>what a good dog. tap to change</span>
                          </>
                        ) : (
                          <span>
                            <strong>choose a photo</strong> of your pup
                          </span>
                        )}
                      </label>
                      <span className="contact-hint">Demo store: the photo stays on your device.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="cf-message">Message</label>
                <textarea id="cf-message" name="message" rows={5} {...invalid("message")} />
                {err("message")}
              </div>

              {errors.form && <p className="contact-error">{errors.form}</p>}

              <button type="submit" className="cozy-btn-orange contact-submit" disabled={status === "sending"}>
                {status === "sending" ? "sending…" : "send message"}
                <IconArrowRight className="cozy-btn-orange__icon" />
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="contact-visit" id="visit" aria-labelledby="visit-title">
        <div className="contact-visit__head" data-reveal>
          <h2 id="visit-title" className="story-title story-title--section">
            come say hi <em>in person</em>
          </h2>
          <p>
            Dogs welcome inside (obviously). There&apos;s a water bowl by the door and a treat jar on the
            counter. Here are our favourite walks nearby.
          </p>
        </div>

        <div className="contact-visit__layout">
          <ul className="spot-list" aria-label="Places on the map">
            <li>
              <button
                type="button"
                className="spot"
                data-kind="shop"
                aria-pressed={focusSpot === null}
                onClick={() => setFocusSpot(null)}
              >
                <span className="spot__name">CozyPaws shop</span>
                <span className="spot__note">{SHOP.address}</span>
              </button>
            </li>
            {SPOTS.map((spot) => (
              <li key={spot.id}>
                <button
                  type="button"
                  className="spot"
                  aria-pressed={focusSpot?.id === spot.id}
                  onClick={() => setFocusSpot(spot)}
                >
                  <span className="spot__name">{spot.name}</span>
                  <span className="spot__note">
                    {spot.walk} · {spot.note}
                  </span>
                </button>
              </li>
            ))}
            <li>
              <a
                className="spot-directions"
                href={directionsUrl((focusSpot ?? SHOP).lat, (focusSpot ?? SHOP).lng)}
                target="_blank"
                rel="noreferrer"
              >
                directions to {focusSpot ? focusSpot.name : "the shop"} <IconArrowUpRight aria-hidden="true" />
              </a>
            </li>
          </ul>

          <div
            ref={mapRef}
            className="contact-map"
            data-state={mapState}
            role="region"
            aria-label="Map of the CozyPaws shop and dog-friendly spots nearby"
          >
            {/* Shown until the live map is ready (and if it can't load). */}
            <div className="contact-map__placeholder" aria-hidden={mapState === "ready"}>
              <span className="contact-map__pin" aria-hidden="true" />
              <p>{mapState === "failed" ? "The map couldn't load. Use the directions link instead." : "loading the map…"}</p>
            </div>
            {mapNear && mapState !== "failed" && (
              <ContactMap focus={focusSpot} onReady={() => setMapState("ready")} onError={() => setMapState("failed")} />
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
