/**
 * map-projection.ts — Converts lat/lng coordinates to SVG x/y positions.
 *
 * The world map SVG (from MapSVG) uses a Mercator projection.
 * We verified this empirically: the UK's SVG path starts at y ≈ 298,
 * and only the Mercator formula produces a matching value (294) for
 * London's latitude. Miller (211) and Equirectangular (150) were way off.
 *
 * Mercator projection formula:
 *   x = longitude (linear)
 *   y = ln(tan(π/4 + latitude_in_radians / 2))
 *
 * The SVG has a geoViewBox attribute that tells us the geographic bounds.
 * We use those bounds plus the SVG dimensions to map from geographic
 * coordinates to pixel positions.
 *
 * Reference: https://en.wikipedia.org/wiki/Mercator_projection
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

// SVG dimensions from the width/height attributes.
// Exported so TravelMap can use them for zoom/pan viewBox calculations.
export const SVG_WIDTH = 1009.6727;
export const SVG_HEIGHT = 665.96301;

// ---------------------------------------------------------------------
// Mercator projection math
// ---------------------------------------------------------------------

/**
 * Convert a latitude value to its Mercator y-projection.
 *
 * The Mercator projection maps latitude to y using:
 *   y = ln(tan(π/4 + lat/2))
 *
 * This stretches areas near the poles and compresses the equator,
 * which is why Greenland looks huge on Mercator maps.
 * The formula produces values from -∞ (south pole) to +∞ (north pole),
 * but in practice maps cut off around ±85° latitude.
 */
function mercatorY(latDeg: number): number {
  // Convert degrees to radians
  const latRad = (latDeg * Math.PI) / 180;

  // Mercator formula: ln(tan(π/4 + lat/2))
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

// Pre-compute the projected y-values for the top and bottom bounds.
// We need these to map from projected coordinates to SVG pixel positions.
const PROJECTED_Y_TOP = mercatorY(GEO_BOUNDS.latTop);
const PROJECTED_Y_BOTTOM = mercatorY(GEO_BOUNDS.latBottom);

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

  // Y uses the Mercator projection — we project the latitude, then scale
  // it from the projected range to the SVG height.
  // Note: SVG y-axis goes top-to-bottom, but latitude goes bottom-to-top,
  // so we invert by subtracting from the top.
  const projectedY = mercatorY(lat);
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
