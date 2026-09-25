import type { Category, Product } from "./types";
import { REMOTE_ASSETS } from "./remote-assets";

export const PRODUCTS: readonly Product[] = [
  { id: "peanut-butter-bites", name: "peanut butter bites", priceCents: 999, category: "food & treats", img: "/assets/pets/cat3.avif", badge: "bestseller", stock: 40 },
  { id: "superfood-kibble", name: "superfood kibble", priceCents: 3499, category: "food & treats", img: REMOTE_ASSETS.superfoodKibble, stock: 25 },
  { id: "dental-chew-pack", name: "dental chew pack", priceCents: 1299, category: "food & treats", img: REMOTE_ASSETS.dentalChewPack, stock: 30 },
  { id: "rope-tug-bundle", name: "rope tug bundle", priceCents: 1199, category: "toys & play", img: "/assets/pets/toy1.avif", badge: "bestseller", stock: 18 },
  { id: "squeaky-friends-set", name: "squeaky friends set", priceCents: 899, category: "toys & play", img: "/assets/pets/toy2.avif", stock: 22 },
  { id: "puzzle-feeder-pro", name: "puzzle feeder pro", priceCents: 2499, category: "toys & play", img: "/assets/pets/toy3.avif", badge: "only 3 left", stock: 3 },
  { id: "cozy-dog-house", name: "cozy dog house", priceCents: 4999, category: "comfy beds", img: "/assets/pets/house1.avif", badge: "bestseller", stock: 2 },
  { id: "cloud-nine-bed", name: "cloud nine bed", priceCents: 7999, category: "comfy beds", img: "/assets/pets/house3.avif", stock: 6 },
  { id: "adventure-harness", name: "adventure harness", priceCents: 2999, category: "walk & travel", img: REMOTE_ASSETS.adventureHarness, stock: 12 },
  { id: "everyday-leash", name: "everyday leash", priceCents: 1999, category: "walk & travel", img: REMOTE_ASSETS.everydayLeash, stock: 20 },
  { id: "gentle-grooming-kit", name: "gentle grooming kit", priceCents: 2799, category: "grooming & care", img: "/assets/pets/gromming.avif", stock: 9 },
  { id: "paw-balm-duo", name: "paw balm duo", priceCents: 1599, category: "grooming & care", img: REMOTE_ASSETS.pawBalmDuo, stock: 15 },
];

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

export const getProduct = (id: string): Product | undefined => byId.get(id);

export const CATEGORY_ACCENT: Record<Category, string> = {
  "food & treats": "var(--color-green)",
  "toys & play": "var(--color-darkblue)",
  "comfy beds": "var(--color-orange)",
  "walk & travel": "var(--color-maroon)",
  "grooming & care": "var(--color-pink)",
};
