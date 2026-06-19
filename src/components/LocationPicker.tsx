"use client";

import { MapPin } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  location: string;
  latitude: number | null;
  longitude: number | null;
  onSelect: (location: string, lat: number, lng: number) => void;
}

export function LocationPicker({ location, latitude, longitude, onSelect }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { "User-Agent": "portfolio/1.0" } },
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
      } catch {
        // silently fail
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const el = mapRef.current as HTMLElement;
      mapInstance.current = L.map(el, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
      }).setView([latitude, longitude], 10);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(mapInstance.current);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;background:#fff;border:2px solid #000;border-radius:50%;transform:translate(-50%,-50%)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([latitude, longitude], { icon }).addTo(mapInstance.current);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [latitude, longitude]);

  const handleSelect = useCallback(
    (result: NominatimResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      onSelect(result.display_name, lat, lng);
      setQuery("");
      setShowResults(false);
    },
    [onSelect],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <input
          type="text"
          placeholder="Search a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          className="w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-fg/20 border-t-fg/60 rounded-full animate-spin" />
          </div>
        )}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg border border-hairline rounded-lg shadow-2xl z-10 max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 text-[11px] text-fg/70 hover:bg-hover-bg hover:text-fg transition-colors border-b border-hairline last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {location && (
        <div className="flex items-center gap-2 px-3 py-2 bg-hover-bg rounded-lg">
          <MapPin weight="thin" className="w-3.5 h-3.5 text-fg/50 shrink-0" />
          <span className="text-[11px] text-fg/60 truncate flex-1">{location}</span>
          <button
            type="button"
            onClick={() => onSelect("", 0, 0)}
            className="text-[11px] text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            Remove
          </button>
        </div>
      )}

      {location && (
        <div
          ref={mapRef}
          className="w-full max-w-sm aspect-video rounded-lg overflow-hidden"
          style={{ background: "var(--hover-bg)" }}
        />
      )}
    </div>
  );
}
