"use client";

import Link from "next/link";
import { useScrollReveal } from "@/lib/useScrollReveal";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  IconArrowRight,
  IconHeart,
  IconTruck,
  IconShield,
} from "@/components/icons";

const unsplash = (id, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const STATS = [
  { value: "10k+", label: "happy dogs", color: "var(--color-green)" },
  { value: "4.8★", label: "average rating", color: "var(--color-darkblue)" },
  { value: "120+", label: "curated products", color: "var(--color-maroon)" },
  { value: "48h", label: "fast delivery", color: "var(--color-orange)" },
];

const VALUES = [
  {
    icon: IconHeart,
    title: "Dogs first, always",
    body: "Every product earns its spot by making a dog's day better — no filler, no fluff.",
    color: "var(--color-pink)",
  },
  {
    icon: IconShield,
    title: "Honestly good stuff",
    body: "Vet-approved, safety-tested and picked by people who actually live with dogs.",
    color: "var(--color-lightblue)",
  },
  {
    icon: IconTruck,
    title: "Delivered with a wag",
    body: "Fast, carbon-neutral shipping and a 30-day no-fuss return promise.",
    color: "var(--color-lightgreen)",
  },
];

const TEAM = [
  {
    name: "Maya & Biscuit",
    role: "Founder & Chief Treat Tester",
    img: "/assets/pets/dog1.avif",
  },
  {
    name: "Theo & Waffle",
    role: "Head of Play",
    img: "/assets/pets/dog2.avif",
  },
  {
    name: "Nour & Luna",
    role: "Comfort Curator",
    img: "/assets/pets/moon-dog.jpg",
  },
];

export default function AboutPage() {
  useScrollReveal();

  return (
    <div className="cozy-page about-page">
      <SiteHeader />

      <section className="about-hero">
        <div className="about-hero__text">
          <span className="about-hero__eyebrow cozy-fade-up cozy-delay-100">
            🐾 our story
          </span>
          <h1 className="about-hero__title cozy-fade-up cozy-delay-200">
            We're a little obsessed with good dogs.
          </h1>
          <p className="about-hero__subtitle cozy-fade-up cozy-delay-300">
            CozyPaws started with one muddy golden retriever, a chewed-up sofa,
            and a simple idea: dogs deserve better stuff. So we set out to make
            a pet store run by dog people, for dog people.
          </p>
          <Link
            href="/shop"
            className="cozy-btn-orange cozy-fade-up cozy-delay-400"
          >
            Shop the good stuff{" "}
            <IconArrowRight className="cozy-btn-orange__icon" />
          </Link>
        </div>
        <div className="about-hero__media cozy-scale-in cozy-delay-300">
          <span className="about-hero__blob" aria-hidden="true" />
          <img
            src={unsplash("photo-1587300003388-59208cc962cb")}
            alt="Happy dogs"
          />
          <img
            src="/assets/pets/paw-sticker.svg"
            alt=""
            aria-hidden="true"
            className="about-hero__paw"
          />
        </div>
      </section>

      <section className="about-stats" aria-label="By the numbers">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="about-stat"
            data-reveal
            style={{ background: stat.color }}
          >
            <span className="about-stat__value">{stat.value}</span>
            <span className="about-stat__label">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="about-story">
        <div className="about-story__media" data-reveal>
          <img
            src={unsplash("photo-1601758228041-f3b2795255f1")}
            alt="Dog on a walk"
          />
        </div>
        <div className="about-story__text" data-reveal data-reveal-delay="0.1">
          <h2 className="about-section-title">
            Made for the ones who greet you like you've been gone for years.
          </h2>
          <p>
            We test everything on our own dogs first (they're brutal reviewers).
            If a toy doesn't survive Biscuit, it doesn't make the shelf. If a
            treat doesn't get the full tail-helicopter, back to the drawing
            board.
          </p>
          <p>
            The result is a tight, no-nonsense collection of things we'd happily
            buy for our own pack — because, well, we do.
          </p>
        </div>
      </section>

      <section className="about-values">
        <h2 className="about-section-title about-values__title" data-reveal>
          What we believe
        </h2>
        <div className="about-values__grid">
          {VALUES.map(({ icon: Icon, title, body, color }) => (
            <article
              key={title}
              className="about-value"
              data-reveal
              style={{ "--accent": color }}
            >
              <span className="about-value__icon">
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-team">
        <h2 className="about-section-title about-team__title" data-reveal>
          The humans (and their bosses)
        </h2>
        <div className="about-team__grid">
          {TEAM.map((member) => (
            <figure key={member.name} className="team-card" data-reveal>
              <div className="team-card__img">
                <img src={member.img} alt={member.name} loading="lazy" />
              </div>
              <figcaption>
                <p className="team-card__name">{member.name}</p>
                <p className="team-card__role">{member.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="about-cta" data-reveal>
        <h2>Ready to spoil your best friend?</h2>
        <Link href="/shop" className="about-cta__btn">
          Explore the shop <IconArrowRight />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
