/**
 * OpenStreetMap's standard tiles: free and keyless (CARTO's basemaps now
 * answer every request with an "API key required" image). They're full colour,
 * so maps that use them carry the `map-mono` class, which filters the tile
 * layer to black and white for the current theme in globals.css. OSM's usage
 * policy requires the attribution.
 */
export const MAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_TILE_ATTRIBUTION = "© OpenStreetMap";
