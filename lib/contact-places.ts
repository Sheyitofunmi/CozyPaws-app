/**
 * Where CozyPaws "is". The store is a demo, so the address is made up; the
 * pin sits on a real street in Islington (N1) so the map has somewhere to be.
 * The nearby spots are real, dog-friendly places; coordinates are approximate.
 */

export interface Spot {
  id: string;
  name: string;
  note: string;
  walk: string;
  lat: number;
  lng: number;
}

export const SHOP = {
  name: "CozyPaws (demo shop)",
  address: "12 bark lane, london N1 7GU",
  lat: 51.5383,
  lng: -0.1029,
};

export const SPOTS: Spot[] = [
  {
    id: "highbury-fields",
    name: "Highbury Fields",
    note: "Big, open, full of zoomies. Our Saturday walk.",
    walk: "15 min walk",
    lat: 51.5497,
    lng: -0.1012,
  },
  {
    id: "regents-canal",
    name: "Regent's Canal towpath",
    note: "Flat, shady, lots of interesting smells.",
    walk: "6 min walk",
    lat: 51.5338,
    lng: -0.0989,
  },
  {
    id: "barnard-park",
    name: "Barnard Park",
    note: "Small, quiet, good for nervous pups.",
    walk: "10 min walk",
    lat: 51.5381,
    lng: -0.1128,
  },
];

export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/* ─── Opening hours (London time) ──────────────────────────────────────── */

export const HOURS = { open: 9, close: 18, days: [1, 2, 3, 4, 5] }; // Mon–Fri, 9–6

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Day of week and fractional hour in London, whatever the visitor's zone. */
function londonNow(now: Date): { day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, hour: Number(get("hour")) + Number(get("minute")) / 60 };
}

export interface OpenState {
  open: boolean;
  /** Short line for the badge, e.g. "open now · usually replies in ~2 hours". */
  label: string;
}

export function openState(now: Date = new Date()): OpenState {
  const { day, hour } = londonNow(now);
  const workday = HOURS.days.includes(day);
  if (workday && hour >= HOURS.open && hour < HOURS.close) {
    const left = HOURS.close - hour;
    return {
      open: true,
      label: left <= 1 ? "open now · closing soon, replies tomorrow morning" : "open now · we usually reply in ~2 hours",
    };
  }
  // Find the next opening time.
  let nextDay = day;
  if (workday && hour < HOURS.open) {
    return { open: false, label: `closed · opens today at ${HOURS.open}am (London)` };
  }
  for (let i = 1; i <= 7; i += 1) {
    nextDay = (day + i) % 7;
    if (HOURS.days.includes(nextDay)) break;
  }
  const when = nextDay === (day + 1) % 7 ? "tomorrow" : DAY_NAMES[nextDay];
  return { open: false, label: `closed · back ${when} at ${HOURS.open}am (London)` };
}
