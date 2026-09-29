"use client";

import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";

/*
 * Refs to the homepage elements that one component needs to read from
 * another, so nobody reaches across the tree with document.querySelector:
 *
 *  - Navbar measures where the light sections start to flip its colours.
 *  - TransitionScribble clones the logo and hides the cursor bubble.
 *
 * The page creates the refs once (useCreateHomeSections) and each owner
 * attaches its own. Readers only touch `.current` inside effects, after React
 * has attached every ref.
 */
export interface HomeSections {
  /** First light section (the horizontal words intro). */
  firstLight: RefObject<HTMLElement | null>;
  services: RefObject<HTMLDivElement | null>;
  marquee: RefObject<HTMLElement | null>;
  footer: RefObject<HTMLElement | null>;
  logo: RefObject<SVGSVGElement | null>;
  cursorBubble: RefObject<HTMLDivElement | null>;
}

const HomeSectionsContext = createContext<HomeSections | null>(null);

/** Creates the refs once; the page owns them and passes them to the provider. */
export function useCreateHomeSections(): HomeSections {
  const firstLight = useRef<HTMLElement>(null);
  const services = useRef<HTMLDivElement>(null);
  const marquee = useRef<HTMLElement>(null);
  const footer = useRef<HTMLElement>(null);
  const logo = useRef<SVGSVGElement>(null);
  const cursorBubble = useRef<HTMLDivElement>(null);
  // Refs are stable, so the object is too (it only matters as a context value).
  const sections = useRef<HomeSections>({ firstLight, services, marquee, footer, logo, cursorBubble });
  return sections.current;
}

export function HomeSectionsProvider({ value, children }: { value: HomeSections; children: ReactNode }) {
  return <HomeSectionsContext.Provider value={value}>{children}</HomeSectionsContext.Provider>;
}

/**
 * The homepage section refs. Outside the homepage (e.g. MobileNav reused on
 * other pages) there is no provider: callers get null and skip the work.
 */
export function useHomeSections(): HomeSections | null {
  return useContext(HomeSectionsContext);
}
