/**
 * Site images, served locally from public/assets/.
 * (They used to be hot-linked from Figma and Unsplash, which made the site
 * depend on hosts that can move, rate-limit or disappear.)
 */
export const REMOTE_ASSETS = {
  logo: "/assets/brand/cozypaws-logo.svg",
  avatar: "/assets/hero/avatar.avif",
  heroBottomLeft: "/assets/hero/dog-left.avif",
  heroBottomCenter: "/assets/hero/dog-center.avif",
  heroBottomRight: "/assets/hero/dog-right.avif",
  aboutHero: "/assets/about/happy-dogs.avif",
  aboutWalk: "/assets/about/dog-walk.avif",
  superfoodKibble: "/assets/products/superfood-kibble.avif",
  dentalChewPack: "/assets/products/dental-chew-pack.avif",
  adventureHarness: "/assets/products/adventure-harness.avif",
  everydayLeash: "/assets/products/everyday-leash.avif",
  pawBalmDuo: "/assets/products/paw-balm-duo.avif",
} as const;

export type RemoteAssetKey = keyof typeof REMOTE_ASSETS;
