"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, MagnifyingGlass } from "@phosphor-icons/react";

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
  const marker = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      const el = mapRef.current as HTMLElement;

      mapInstance.current = L.map(el, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
      }).setView([20, 0], 2);

      L.tileLayer("https://{s}.basemaps.cartocdn.gl/ol/gl/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapInstance.current);

      if (latitude && longitude) {
        mapInstance.current.setView([latitude, longitude], 10);
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;background:#fff;border:2px solid #000;border-radius:50%;transform:translate(-50%,-50%)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        marker.current = L.marker([latitude, longitude], { icon }).addTo(mapInstance.current);
      }
    });
  }, [latitude, longitude]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "User-Agent": "portfolio/1.0" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setShowResults(data.length > 0);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleSelect = useCallback(
    (result: NominatimResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      onSelect(result.display_name, lat, lng);
      setQuery("");
      setShowResults(false);
    },
    [onSelect]
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search a location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
            className="w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors"
          />
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
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all disabled:opacity-50"
        >
          <MagnifyingGlass weight="thin" className="w-3.5 h-3.5" />
        </button>
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

      <div ref={mapRef} className="w-full h-32 rounded-lg overflow-hidden" style={{ background: "var(--hover-bg)" }} />
    </div>
  );
}
