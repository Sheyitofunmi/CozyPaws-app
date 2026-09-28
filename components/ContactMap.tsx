"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type LayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { SHOP, SPOTS, type Spot } from "@/lib/contact-places";

/**
 * The live map on /contact. Loaded only when it scrolls near the viewport
 * (see ContactMapSection), so the ~250KB map library never slows the page.
 *
 * Tiles: OpenFreeMap (free, no API key, OpenStreetMap data). They're vector
 * tiles, so the map is recoloured at runtime to the CozyPaws palette instead
 * of looking like every other embedded map.
 */

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const PALETTE = {
  land: "#f3f7ef",
  water: "#bcd0ff", // soft version of --color-lightblue
  park: "#cdeebf",
  wood: "#b9e3a9",
  building: "#e7ece2",
  roadMajor: "#ffffff",
  roadMinor: "#ffffff",
  roadCasing: "#dfe6da",
  label: "#29725f", // --color-green
  labelHalo: "#f3f7ef",
};

function recolour(map: MapLibreMap) {
  const layers = (map.getStyle().layers ?? []) as LayerSpecification[];
  for (const layer of layers) {
    const src = "source-layer" in layer ? (layer["source-layer"] as string | undefined) : undefined;
    const id = layer.id;
    try {
      if (layer.type === "background") map.setPaintProperty(id, "background-color", PALETTE.land);
      else if (layer.type === "fill" && (src === "water" || /water/.test(id)))
        map.setPaintProperty(id, "fill-color", PALETTE.water);
      else if (layer.type === "fill" && (src === "park" || /park/.test(id)))
        map.setPaintProperty(id, "fill-color", PALETTE.park);
      else if (layer.type === "fill" && src === "landcover")
        map.setPaintProperty(id, "fill-color", /wood|forest/.test(id) ? PALETTE.wood : PALETTE.park);
      else if (layer.type === "fill" && src === "building")
        map.setPaintProperty(id, "fill-color", PALETTE.building);
      else if (layer.type === "line" && src === "waterway")
        map.setPaintProperty(id, "line-color", PALETTE.water);
      else if (layer.type === "line" && src === "transportation")
        map.setPaintProperty(
          id,
          "line-color",
          /casing/.test(id) ? PALETTE.roadCasing : /motorway|trunk|primary/.test(id) ? PALETTE.roadMajor : PALETTE.roadMinor,
        );
      else if (layer.type === "symbol") {
        map.setPaintProperty(id, "text-color", PALETTE.label);
        map.setPaintProperty(id, "text-halo-color", PALETTE.labelHalo);
      }
    } catch {
      /* a layer without that paint property: leave it as the style made it */
    }
  }
}

function markerEl(kind: "shop" | "spot", label: string) {
  const el = document.createElement("div");
  el.className = `map-pin map-pin--${kind}`;
  el.setAttribute("aria-hidden", "true");
  el.title = label;
  el.innerHTML =
    kind === "shop"
      ? `<svg viewBox="0 0 48 58" width="48" height="58"><path d="M24 57s20-19.5 20-33A20 20 0 0 0 4 24c0 13.5 20 33 20 33Z" fill="#f5693c" stroke="#fff" stroke-width="3"/><g fill="#fff"><ellipse cx="24" cy="29" rx="6.5" ry="5.5"/><circle cx="15.5" cy="21" r="3"/><circle cx="21" cy="16.5" r="3"/><circle cx="27" cy="16.5" r="3"/><circle cx="32.5" cy="21" r="3"/></g></svg>`
      : `<svg viewBox="0 0 30 30" width="30" height="30"><circle cx="15" cy="15" r="13" fill="#29725f" stroke="#fff" stroke-width="3"/><path d="M10 17c2 3 8 3 10 0" stroke="#e6fab9" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="11" cy="12" r="1.8" fill="#e6fab9"/><circle cx="19" cy="12" r="1.8" fill="#e6fab9"/></svg>`;
  return el;
}

interface Props {
  /** The spot the visitor picked in the list next to the map. */
  focus: Spot | null;
  onReady?: () => void;
  onError?: () => void;
}

export default function ContactMap({ focus, onReady, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const map = new maplibregl.Map({
      container,
      style: STYLE_URL,
      center: [SHOP.lng, SHOP.lat],
      zoom: 14.2,
      minZoom: 11,
      maxZoom: 18,
      attributionControl: { compact: true },
      // Scrolling the page never gets hijacked by the map: zoom needs
      // Ctrl/⌘ + scroll, and on phones two fingers to pan.
      cooperativeGestures: true,
      fadeDuration: reduce ? 0 : 300,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("style.load", () => recolour(map));
    map.once("load", () => {
      setLoaded(true);
      onReady?.();
    });
    map.on("error", (e) => {
      // A failed style (offline, blocked) means no map at all: fall back.
      if (!map.isStyleLoaded()) onError?.();
      console.warn("[map]", e.error?.message);
    });

    new maplibregl.Marker({ element: markerEl("shop", SHOP.name), anchor: "bottom" })
      .setLngLat([SHOP.lng, SHOP.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 40, closeButton: false }).setHTML(
          `<strong>${SHOP.name}</strong><br/>${SHOP.address}<br/><span class="map-popup__note">dog water bowl by the door</span>`,
        ),
      )
      .addTo(map);

    for (const spot of SPOTS) {
      new maplibregl.Marker({ element: markerEl("spot", spot.name), anchor: "center" })
        .setLngLat([spot.lng, spot.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
            `<strong>${spot.name}</strong><br/>${spot.note}`,
          ),
        )
        .addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; callbacks are read at event time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to whatever the visitor picked in the list (jump with reduced motion).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const target = focus ?? SHOP;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const camera = { center: [target.lng, target.lat] as [number, number], zoom: focus ? 15.2 : 14.2 };
    if (reduce) map.jumpTo(camera);
    else map.flyTo({ ...camera, speed: 1.2, curve: 1.3, essential: false });
  }, [focus, loaded]);

  return <div ref={containerRef} className="contact-map__canvas" />;
}
