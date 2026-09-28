/**
 * Clips for the full-bleed video hero. Each one is a 6s, 1280×720, 30fps,
 * silent clip (~0.3–1.2MB) in H.264 MP4 and VP9 WebM, cut from a free Pexels video (Pexels License).
 * The reel plays them in order and crossfades between them.
 */
export interface HeroClip {
  /** Path without extension: every clip ships as `.mp4` (H.264) and `.webm` (VP9). */
  src: string;
  /** Short description, used for the progress buttons' labels. */
  label: string;
  credit: string;
}

export const HERO_REEL: HeroClip[] = [
  { src: "/assets/hero-reel/jack-russell", label: "A happy jack russell in a field", credit: "Judas Isariot" },
  { src: "/assets/hero-reel/golden-run", label: "A golden retriever running by a lake", credit: "Yaroslav Bilgovskiy" },
  { src: "/assets/hero-reel/beach-trot", label: "A golden dog trotting through the surf", credit: "Dominik Gryzbon" },
  { src: "/assets/hero-reel/river-play", label: "Two dogs play-fighting in a river", credit: "K" },
  { src: "/assets/hero-reel/puppy-toy", label: "A puppy chewing a rope toy", credit: "My NATURE'AL life" },
  { src: "/assets/hero-reel/marsh-sniff", label: "A fluffy dog exploring a marsh", credit: "Michał Robak" },
];
