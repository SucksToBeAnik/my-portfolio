"use client";

import { useEffect, useRef } from "react";

interface TravelEvent {
  id: number;
  title: string;
  type: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean | null;
  latitude: number;
  longitude: number;
}

const MARKER_COLORS: Record<string, string> = {
  education: "#3b82f6",
  work: "#22c55e",
  travel: "#f97316",
  milestone: "#a855f7",
};

function markerSvg(type: string): string {
  const color = MARKER_COLORS[type] || "#6b7280";
  return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="13" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
}

export function TravelMap({ events }: { events: TravelEvent[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container || mapInstance.current) return;

    async function init() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      const map = L.map(container!, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      }).setView([20, 0], 2);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      for (const event of events) {
        const icon = L.divIcon({
          html: markerSvg(event.type),
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([event.latitude, event.longitude], { icon }).addTo(map);
        bounds.extend([event.latitude, event.longitude]);

        const dateStr = event.endDate
          ? `${event.startDate} - ${event.endDate}`
          : event.current
            ? `${event.startDate} - Present`
            : event.startDate;

        const loc = event.location ? `<br/><span style="font-size:11px;color:#888">${event.location}</span>` : "";

        marker.bindPopup(`
          <div style="font-family:Space Mono,monospace;font-size:12px;line-height:1.4">
            <strong>${event.title}</strong>
            <br/>
            <span style="font-size:11px;color:#888">${dateStr}</span>
            ${loc}
          </div>
        `);
      }

      if (events.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstance.current = map;
    }

    init();

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [events]);

  return (
    <div
      ref={mapRef}
      className="fixed inset-0 z-10"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
