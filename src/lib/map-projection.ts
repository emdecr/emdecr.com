/**
 * map-projection.ts — Converts lat/lng coordinates to SVG x/y positions.
 *
 * The world map SVG (from MapSVG) uses a Miller cylindrical projection.
 * This file implements the same projection math so we can place pins
 * at the correct positions on the map.
 *
 * Miller projection formula:
 *   x = longitude (linear)
 *   y = 1.25 * ln(tan(π/4 + 0.4 * latitude_in_radians))
 *
 * The key insight: the SVG has a geoViewBox attribute that tells us
 * the geographic bounds of the map. We use those bounds plus the SVG
 * dimensions to map from geographic coordinates to pixel positions.
 *
 * Reference: https://en.wikipedia.org/wiki/Miller_cylindrical_projection
 */

// ---------------------------------------------------------------------
// SVG map constants — derived from the world.svg file
// ---------------------------------------------------------------------

// The geoViewBox from the SVG: "-169.110266 83.600842 190.486279 -58.508473"
// Format: lonLeft latTop lonRight latBottom
const GEO_BOUNDS = {
  lonLeft: -169.110266,
  latTop: 83.600842,
  lonRight: 190.486279,
  latBottom: -58.508473,
} as const;

// SVG dimensions from the width/height attributes
const SVG_WIDTH = 1009.6727;
const SVG_HEIGHT = 665.96301;

// ---------------------------------------------------------------------
// Miller projection math
// ---------------------------------------------------------------------

/**
 * Convert a latitude value to its Miller y-projection.
 *
 * The Miller cylindrical projection modifies Mercator by:
 * 1. Multiplying the latitude by 0.8 (4/5) before the Mercator formula
 * 2. Multiplying the result by 1.25 (5/4) after
 *
 * This reduces the distortion at the poles compared to Mercator,
 * making it better for world maps that include polar regions.
 */
function millerY(latDeg: number): number {
  // Convert degrees to radians
  const latRad = (latDeg * Math.PI) / 180;

  // Miller formula: 1.25 * ln(tan(π/4 + 0.4 * lat))
  // The 0.4 = 2/5, and 1.25 = 5/4 — these are the Miller modification factors
  return 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * latRad));
}

// Pre-compute the projected y-values for the top and bottom bounds.
// We need these to map from projected coordinates to SVG pixel positions.
const PROJECTED_Y_TOP = millerY(GEO_BOUNDS.latTop);
const PROJECTED_Y_BOTTOM = millerY(GEO_BOUNDS.latBottom);

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Convert a lat/lng coordinate to an x/y position within the SVG.
 *
 * @param lat - Latitude in decimal degrees (north is positive, e.g. 51.5 for London)
 * @param lng - Longitude in decimal degrees (east is positive, e.g. -0.12 for London)
 * @returns { x, y } position in SVG coordinate space (matching the viewBox)
 *
 * @example
 *   const { x, y } = latLngToSvgPoint(51.5074, -0.1278); // London
 *   // Use x, y as cx/cy on an SVG <circle> element
 */
export function latLngToSvgPoint(
  lat: number,
  lng: number
): { x: number; y: number } {
  // X is linear — longitude maps directly to horizontal position.
  // We just need to scale it from the geographic range to the SVG width.
  const x =
    ((lng - GEO_BOUNDS.lonLeft) / (GEO_BOUNDS.lonRight - GEO_BOUNDS.lonLeft)) *
    SVG_WIDTH;

  // Y uses the Miller projection — we project the latitude, then scale
  // it from the projected range to the SVG height.
  // Note: SVG y-axis goes top-to-bottom, but latitude goes bottom-to-top,
  // so we invert by subtracting from the top.
  const projectedY = millerY(lat);
  const y =
    ((PROJECTED_Y_TOP - projectedY) / (PROJECTED_Y_TOP - PROJECTED_Y_BOTTOM)) *
    SVG_HEIGHT;

  return { x, y };
}

/**
 * The SVG viewBox string, exported so the map component can use it
 * without hardcoding the dimensions in multiple places.
 */
export const MAP_VIEWBOX = `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`;
