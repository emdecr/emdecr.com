/**
 * TravelMap — Client component that renders the interactive world map.
 *
 * How it works:
 *   1. The server component (page.tsx) reads the SVG file and passes
 *      the inner path content as a string via `mapSvgContent`.
 *   2. This component renders an <svg> element with:
 *      - The map paths (via dangerouslySetInnerHTML on a <g> group)
 *      - A <circle> pin for each travel location
 *   3. Pins are positioned using the Miller cylindrical projection
 *      from map-projection.ts, converting lat/lng to SVG x/y coords.
 *
 * Why dangerouslySetInnerHTML for the map paths?
 *   The SVG file is 1.2MB of <path> elements. Inlining them as JSX
 *   would add all that to the client JS bundle. Instead, the server
 *   reads the file and sends the paths as a string in the RSC payload
 *   (static HTML, not JS). The pins are real React elements so they
 *   can have event handlers for hover/click interactivity.
 *
 * Interactivity (added in later phases):
 *   - Phase 3: Tooltip on hover
 *   - Phase 4: Modal on click
 */

"use client";

import { latLngToSvgPoint, MAP_VIEWBOX } from "@/lib/map-projection";
import type { Travel } from "@/lib/travels";

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

type TravelMapProps = {
  travels: Travel[];
  mapSvgContent: string; // Inner SVG content (the <path> elements)
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function TravelMap({ travels, mapSvgContent }: TravelMapProps) {
  return (
    // Wrapper div needs position:relative so we can absolutely-position
    // the tooltip (Phase 3) over the SVG.
    <div className="relative">
      <svg
        viewBox={MAP_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label="World map with travel location pins"
      >
        {/*
          Map paths — the country shapes from the SVG file.
          These are static (no interaction), so we render them as raw HTML
          inside a <g> group. The fill/stroke styles make the countries
          a subtle background so the pins stand out.
        */}
        <g
          className="[&_path]:fill-gray-200 [&_path]:stroke-gray-300 [&_path]:stroke-[0.5]"
          dangerouslySetInnerHTML={{ __html: mapSvgContent }}
        />

        {/*
          Pins — one <circle> per travel location.
          Each pin is a real React element so it can have event handlers
          for hover (tooltip) and click (modal) interactions.
        */}
        {travels.map((travel) => {
          // Convert lat/lng to SVG coordinates using Miller projection
          const { x, y } = latLngToSvgPoint(travel.lat, travel.lng);

          return (
            <circle
              key={travel.id}
              cx={x}
              cy={y}
              r={5}
              className="fill-black cursor-pointer transition-colors hover:fill-red-500"
              // Accessibility: make pins focusable and announce the location
              role="button"
              tabIndex={0}
              aria-label={`${travel.name}, ${travel.country}`}
            />
          );
        })}
      </svg>
    </div>
  );
}
