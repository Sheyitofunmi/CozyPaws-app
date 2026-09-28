import type { Category, Product } from "./types";
import { REMOTE_ASSETS } from "./remote-assets";

export const PRODUCTS: readonly Product[] = [
  { id: "peanut-butter-bites", name: "peanut butter bites", priceCents: 999, category: "food & treats", img: "/assets/products/peanut-butter-bites.jpg", img2: "/assets/products/peanut-butter-bites-2.jpg", badge: "bestseller", stock: 40, popularity: 98, approved: true },
  { id: "superfood-kibble", name: "superfood kibble", priceCents: 3499, category: "food & treats", img: "/assets/products/superfood-kibble.jpg", img2: "/assets/products/superfood-kibble-2.jpg", stock: 25, popularity: 80, approved: true },
  { id: "dental-chew-pack", name: "dental chew pack", priceCents: 1299, category: "food & treats", img: REMOTE_ASSETS.dentalChewPack, stock: 30, popularity: 64 },
  { id: "ceramic-slow-bowl", name: "ceramic slow bowl", priceCents: 1899, category: "food & treats", img: "/assets/products/ceramic-slow-bowl.jpg", stock: 16, popularity: 52, isNew: true },
  { id: "rope-tug-bundle", name: "rope tug bundle", priceCents: 1199, category: "toys & play", img: "/assets/products/rope-tug-bundle.jpg", img2: "/assets/products/rope-tug-bundle-2.jpg", badge: "bestseller", stock: 18, popularity: 95, approved: true },
  { id: "squeaky-friends-set", name: "squeaky friends set", priceCents: 899, category: "toys & play", img: "/assets/products/squeaky-friends-set.jpg", img2: "/assets/products/squeaky-friends-set-2.jpg", stock: 22, popularity: 77 },
  { id: "puzzle-feeder-pro", name: "puzzle feeder pro", priceCents: 2499, category: "toys & play", img: "/assets/products/puzzle-feeder-pro.jpg", img2: "/assets/products/puzzle-feeder-pro-2.jpg", badge: "only 3 left", stock: 3, popularity: 88, approved: true },
  { id: "fetch-ball-trio", name: "fetch ball trio", priceCents: 999, category: "toys & play", img: "/assets/products/fetch-ball-trio.jpg", stock: 35, popularity: 70, approved: true },
  { id: "cozy-dog-house", name: "cozy dog house", priceCents: 4999, category: "comfy beds", img: "/assets/pets/house1.avif", badge: "bestseller", stock: 2, popularity: 90 },
  { id: "cloud-nine-bed", name: "cloud nine bed", priceCents: 7999, category: "comfy beds", img: "/assets/products/cloud-nine-bed.jpg", stock: 6, popularity: 84, approved: true },
  { id: "woven-basket-bed", name: "woven basket bed", priceCents: 5999, category: "comfy beds", img: "/assets/products/woven-basket-bed.jpg", badge: "new", stock: 8, popularity: 58, isNew: true },
  { id: "adventure-harness", name: "adventure harness", priceCents: 2999, category: "walk & travel", img: REMOTE_ASSETS.adventureHarness, stock: 12, popularity: 72, approved: true },
  { id: "everyday-leash", name: "everyday leash", priceCents: 1999, category: "walk & travel", img: "/assets/products/everyday-leash.jpg", stock: 20, popularity: 66 },
  { id: "puddle-proof-raincoat", name: "puddle-proof raincoat", priceCents: 3499, category: "walk & travel", img: "/assets/products/puddle-proof-raincoat.jpg", badge: "new", stock: 10, popularity: 61, isNew: true },
  { id: "snuggle-travel-blanket", name: "snuggle travel blanket", priceCents: 2499, category: "walk & travel", img: "/assets/products/snuggle-travel-blanket.jpg", stock: 14, popularity: 49, isNew: true },
  { id: "gentle-grooming-kit", name: "gentle grooming kit", priceCents: 2799, category: "grooming & care", img: "/assets/pets/gromming.avif", stock: 9, popularity: 55 },
  { id: "paw-balm-duo", name: "paw balm duo", priceCents: 1599, category: "grooming & care", img: REMOTE_ASSETS.pawBalmDuo, stock: 15, popularity: 60, approved: true },
  { id: "quick-dry-spa-towel", name: "quick-dry spa towel", priceCents: 1499, category: "grooming & care", img: "/assets/products/quick-dry-spa-towel.jpg", stock: 20, popularity: 47, isNew: true },
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
