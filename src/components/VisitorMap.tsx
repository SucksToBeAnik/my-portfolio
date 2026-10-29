"use client";

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-tiles";

export type VisitorMapPoint = { lat: number; lng: number; label: string; visitors: number };

/** Where visitors came from: one dot per place, bigger the more people. */
export function VisitorMap({ points }: { points: VisitorMapPoint[] }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current || points.length === 0) return;
    let map: LeafletMap | null = null;
    let cancelled = false;

    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(([L]) => {
      if (cancelled || !el.current) return;
      // No zoom buttons; drag, pinch and double-click still zoom.
      map = L.map(el.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        minZoom: 1,
      });
      L.tileLayer(MAP_TILE_URL, { maxZoom: 12 }).addTo(map);
      L.control.attribution({ prefix: false }).addAttribution(MAP_TILE_ATTRIBUTION).addTo(map);

      // Colour comes from `.visitor-dot` in globals.css, so it follows the theme.
      for (const p of points) {
        L.circleMarker([p.lat, p.lng], {
          radius: 5 + Math.sqrt(p.visitors) * 2,
          className: "visitor-dot",
          weight: 2,
          fillOpacity: 0.85,
        })
          .bindTooltip(`${p.label} · ${p.visitors} ${p.visitors === 1 ? "visitor" : "visitors"}`)
          .addTo(map);
      }

      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), {
        padding: [40, 40],
        maxZoom: 4,
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div
      ref={el}
      className="map-mono w-full aspect-[2/1] rounded-xl overflow-hidden border border-hairline"
      style={{ background: "var(--hover-bg)" }}
    />
  );
}
