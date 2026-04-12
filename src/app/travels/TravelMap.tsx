/**
 * TravelMap — Client component that renders the interactive world map.
 *
 * How it works:
 *   1. The server component (page.tsx) groups trips by location and passes
 *      an array of GroupedTravel objects (one per unique city).
 *   2. This component renders an <svg> element with:
 *      - The map paths (via dangerouslySetInnerHTML on a <g> group)
 *      - One <circle> pin per unique location (not per trip)
 *   3. Pins are positioned using the Mercator projection from
 *      map-projection.ts, converting lat/lng to SVG x/y coords.
 *
 * Why dangerouslySetInnerHTML for the map paths?
 *   The SVG file is ~600KB of <path> elements. Inlining them as JSX
 *   would add all that to the client JS bundle. Instead, the server
 *   reads the file and sends the paths as a string in the RSC payload
 *   (static HTML, not JS). The pins are real React elements so they
 *   can have event handlers for hover/click interactivity.
 *
 * Interactivity:
 *   - Hover: tooltip with location name + visit count
 *   - Click: modal with full visit history, images, and links
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { latLngToSvgPoint, MAP_VIEWBOX } from "@/lib/map-projection";
// Import from travel-types.ts (not travels.ts) because travels.ts
// contains Node.js imports (fs, path) that can't be bundled for the client.
import type { GroupedTravel } from "@/lib/travel-types";
import TravelModal from "./TravelModal";

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

type TravelMapProps = {
  locations: GroupedTravel[]; // One entry per unique location
  mapSvgContent: string; // Inner SVG content (the <path> elements)
};

// Tooltip position in pixel coordinates (relative to the map wrapper div)
type TooltipPosition = {
  x: number;
  y: number;
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function TravelMap({ locations, mapSvgContent }: TravelMapProps) {
  // Which location is currently hovered (null = no tooltip shown)
  const [hovered, setHovered] = useState<GroupedTravel | null>(null);

  // Which location is selected (null = modal closed).
  // Set when a pin is clicked, cleared when the modal is closed.
  const [selected, setSelected] = useState<GroupedTravel | null>(null);

  // Tooltip position in pixels, updated on mouse move over a pin.
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ x: 0, y: 0 });

  // Ref to the wrapper div — we use it to calculate tooltip position
  // relative to the container (not the page).
  const wrapperRef = useRef<HTMLDivElement>(null);

  /**
   * Convert a mouse event's page coordinates to positions relative to
   * the map wrapper div. This ensures the tooltip is positioned correctly
   * even if the map is scrolled or offset on the page.
   */
  const updateTooltipPosition = useCallback(
    (e: React.MouseEvent) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  return (
    // Wrapper div with position:relative so the tooltip (position:absolute)
    // is positioned relative to the map, not the page.
    <div ref={wrapperRef} className="relative">
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
          inside a <g> group.
        */}
        <g
          className="[&_path]:fill-gray-200 [&_path]:stroke-gray-300 [&_path]:stroke-[0.5]"
          dangerouslySetInnerHTML={{ __html: mapSvgContent }}
        />

        {/*
          Pins — one <circle> per unique location (not per trip).
          Repeat visits (5x Montreal) show as a single pin.
        */}
        {locations.map((location) => {
          // Convert lat/lng to SVG coordinates using Mercator projection
          const { x, y } = latLngToSvgPoint(location.lat, location.lng);
          const tripCount = location.trips.length;

          return (
            <circle
              key={location.name}
              cx={x}
              cy={y}
              r={5}
              // Visited pins are solid black, wishlist pins are outlined.
              // Both turn red on hover for a consistent interactive feel.
              className={`cursor-pointer transition-colors hover:fill-red-500 ${
                location.status === "wishlist"
                  ? "fill-white stroke-black stroke-[1.5]"
                  : "fill-black"
              }`}
              // Hover handlers: show/hide the tooltip and track cursor position
              onMouseEnter={(e) => {
                setHovered(location);
                updateTooltipPosition(e);
              }}
              onMouseMove={updateTooltipPosition}
              onMouseLeave={() => setHovered(null)}
              // Click handler: open the detail modal for this location
              onClick={() => {
                setSelected(location);
                setHovered(null); // Hide tooltip when modal opens
              }}
              // Accessibility: make pins focusable and announce the location.
              // Enter/Space opens the modal, matching button behavior.
              role="button"
              tabIndex={0}
              aria-label={`${location.name}, ${location.country}${tripCount > 1 ? ` — ${tripCount} visits` : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(location);
                  setHovered(null);
                }
              }}
            />
          );
        })}
      </svg>

      {/*
        Tooltip — shows location name, country, and visit count.
        pointer-events-none prevents it from blocking pin hover events.
      */}
      {hovered && (
        <div
          className="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm text-sm"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <p className="font-medium whitespace-nowrap">
            {hovered.name}, {hovered.country}
          </p>
          <p className="text-gray-500 text-xs whitespace-nowrap">
            {hovered.trips.length === 1
              ? hovered.status === "wishlist"
                ? "Wishlist"
                : "1 visit"
              : `${hovered.trips.length} visits`}
          </p>
        </div>
      )}

      {/*
        Modal — rendered when a pin is clicked.
        Now receives a GroupedTravel with all trips for this location.
      */}
      {selected && (
        <TravelModal
          location={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
