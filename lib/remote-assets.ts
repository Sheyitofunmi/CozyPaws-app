/**
 * Every image the site loads from another origin lives here, in one place.
 *
 * Hot-linked images are a reliability risk (the host can move, rate-limit or
 * disappear) and they skip our own caching. Run `npm run assets:localize` once
 * with internet access: it downloads each file into public/assets/remote/ and
 * rewrites this map to point at the local copies.
 */
const FIGMA = "https://polo-pecan-73837341.figma.site/_assets/v11";
const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const REMOTE_ASSETS = {
  logo: `${FIGMA}/0ae29d6d9628bede667f90d57bebe81b8f1ec2bf.svg`,
  avatar: `${FIGMA}/e62173d41f91350a59628e8a9a55ae078a886fb9.png?w=128`,
  heroBottomLeft: `${FIGMA}/8d44b25186ef45a5789c74668fb781cea4e1ff49.png`,
  heroBottomCenter: `${FIGMA}/96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024`,
  heroBottomRight: `${FIGMA}/81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png`,
  aboutHero: unsplash("photo-1587300003388-59208cc962cb", 1000),
  aboutWalk: unsplash("photo-1601758228041-f3b2795255f1", 1000),
  superfoodKibble: unsplash("photo-1552053831-71594a27632d"),
  dentalChewPack: unsplash("photo-1583511655857-d19b40a7a54e"),
  adventureHarness: unsplash("photo-1548199973-03cce0bbc87b"),
  everydayLeash: unsplash("photo-1601758228041-f3b2795255f1"),
  pawBalmDuo: unsplash("photo-1518717758536-85ae29035b6d"),
} as const;

export type RemoteAssetKey = keyof typeof REMOTE_ASSETS;
