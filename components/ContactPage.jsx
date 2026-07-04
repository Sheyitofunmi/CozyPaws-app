"use client";

import { useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { IconArrowRight, IconCheck } from "@/components/icons";

const TOPICS = [
  "General",
  "My order",
  "Product help",
  "Wholesale",
  "Say hi 👋",
];

const CONTACT_CARDS = [
  {
    emoji: "✉️",
    title: "Email us",
    detail: "hello@cozypaws.co",
    href: "mailto:hello@cozypaws.co",
    color: "var(--color-green)",
  },
  {
    emoji: "💬",
    title: "WhatsApp",
    detail: "we're millennials — please don't call",
    href: "#",
    color: "var(--color-darkblue)",
  },
  {
    emoji: "📍",
    title: "Visit",
    detail: "papaverhof 21, 1032 LX amsterdam",
    href: "#",
    color: "var(--color-maroon)",
  },
];

export default function ContactPage() {
  useScrollReveal();
  const [topic, setTopic] = useState("General");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrors({});

    const form = e.currentTarget;
    const payload = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value,
      topic,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(
          data.errors || { form: data.error || "Something went wrong." },
        );
        setStatus("error");
        return;
      }

      setSuccessMsg(data.message);
      setStatus("success");
      form.reset();
      setTopic("General");
    } catch {
      setErrors({ form: "Network hiccup — please try again." });
      setStatus("error");
    }
  };

  return (
    <div className="cozy-page contact-page">
      <SiteHeader />

      <section className="contact-hero">
        <span className="contact-hero__eyebrow cozy-fade-up cozy-delay-100">
          🐾 get in touch
        </span>
        <h1 className="contact-hero__title cozy-fade-up cozy-delay-200">
          Let's talk dogs
        </h1>
        <p className="contact-hero__subtitle cozy-fade-up cozy-delay-300">
          Question about an order, a product, or just want to send a photo of
          your dog? We're all ears (and floppy ones at that).
        </p>
      </section>

      <section className="contact-body">
        {/* ─── Info cards ─── */}
        <div className="contact-cards">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="contact-card"
              data-reveal
              style={{ "--accent": card.color }}
            >
              <span className="contact-card__emoji" aria-hidden="true">
                {card.emoji}
              </span>
              <div>
                <p className="contact-card__title">{card.title}</p>
                <p className="contact-card__detail">{card.detail}</p>
              </div>
            </a>
          ))}
          <p className="contact-hours" data-reveal>
            <strong>Hours:</strong> Mon–Fri, 9–6 CET. We reply within one
            business day.
          </p>
        </div>

        {/* ─── Form ─── */}
        <div className="contact-form-wrap" data-reveal data-reveal-delay="0.1">
          {status === "success" ? (
            <div className="contact-success" role="status">
              <span className="contact-success__check">
                <IconCheck />
              </span>
              <h2>Message sent!</h2>
              <p>{successMsg}</p>
              <button
                className="cozy-btn-orange"
                onClick={() => setStatus("idle")}
              >
                send another
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={onSubmit} noValidate>
              <div className="contact-field">
                <label htmlFor="cf-name">Your name</label>
                <input
                  id="cf-name"
                  name="name"
                  type="text"
                  placeholder="Jane & Rex"
                />
                {errors.name && (
                  <span className="contact-error">{errors.name}</span>
                )}
              </div>

              <div className="contact-field">
                <label htmlFor="cf-email">Email</label>
                <input
                  id="cf-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <span className="contact-error">{errors.email}</span>
                )}
              </div>

              <div className="contact-field">
                <label>What's it about?</label>
                <div className="contact-topics">
                  {TOPICS.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`contact-topic ${topic === t ? "is-active" : ""}`}
                      onClick={() => setTopic(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="cf-message">Message</label>
                <textarea
                  id="cf-message"
                  name="message"
                  rows={5}
                  placeholder="Tell us everything (dog photos welcome)…"
                />
                {errors.message && (
                  <span className="contact-error">{errors.message}</span>
                )}
              </div>

              {errors.form && <p className="contact-error">{errors.form}</p>}

              <button
                type="submit"
                className="cozy-btn-orange contact-submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? "sending…" : "send message"}
                <IconArrowRight className="cozy-btn-orange__icon" />
              </button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
