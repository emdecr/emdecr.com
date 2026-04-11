/**
 * TravelMap — Client component that renders the interactive world map.
 *
 * How it works:
 *   1. The server component (page.tsx) reads the SVG file and passes
 *      the inner path content as a string via `mapSvgContent`.
 *   2. This component renders an <svg> element with:
 *      - The map paths (via dangerouslySetInnerHTML on a <g> group)
 *      - A <circle> pin for each travel location
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
 *   - Hover: shows a tooltip with location name + date (Phase 3)
 *   - Click: opens a modal with details + images (Phase 4)
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { latLngToSvgPoint, MAP_VIEWBOX } from "@/lib/map-projection";
// Import from travel-types.ts (not travels.ts) because travels.ts
// contains Node.js imports (fs, path) that can't be bundled for the client.
import { formatTravelDate } from "@/lib/travel-types";
import type { Travel } from "@/lib/travel-types";
import TravelModal from "./TravelModal";

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

type TravelMapProps = {
  travels: Travel[];
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

export default function TravelMap({ travels, mapSvgContent }: TravelMapProps) {
  // Which travel entry is currently hovered (null = no tooltip shown)
  const [hovered, setHovered] = useState<Travel | null>(null);

  // Which travel entry is selected (null = modal closed).
  // Set when a pin is clicked, cleared when the modal is closed.
  const [selected, setSelected] = useState<Travel | null>(null);

  // Tooltip position in pixels, updated on mouse move over a pin.
  // We track this separately from `hovered` because the tooltip follows
  // the cursor rather than being anchored to a fixed point.
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
          inside a <g> group. The fill/stroke styles make the countries
          a subtle background so the pins stand out.
        */}
        <g
          className="[&_path]:fill-gray-200 [&_path]:stroke-gray-300 [&_path]:stroke-[0.5]"
          dangerouslySetInnerHTML={{ __html: mapSvgContent }}
        />

        {/*
          Pins — one <circle> per travel location.
          Each pin is a real React element so it can have event handlers.
          On hover: show tooltip. On click: open modal (Phase 4).
        */}
        {travels.map((travel) => {
          // Convert lat/lng to SVG coordinates using Mercator projection
          const { x, y } = latLngToSvgPoint(travel.lat, travel.lng);

          return (
            <circle
              key={travel.id}
              cx={x}
              cy={y}
              r={5}
              // Visited pins are solid black, wishlist pins are outlined.
              // Both turn red on hover for a consistent interactive feel.
              className={`cursor-pointer transition-colors hover:fill-red-500 ${
                travel.status === "wishlist"
                  ? "fill-white stroke-black stroke-[1.5]"
                  : "fill-black"
              }`}
              // Hover handlers: show/hide the tooltip and track cursor position
              onMouseEnter={(e) => {
                setHovered(travel);
                updateTooltipPosition(e);
              }}
              onMouseMove={updateTooltipPosition}
              onMouseLeave={() => setHovered(null)}
              // Click handler: open the detail modal for this location
              onClick={() => {
                setSelected(travel);
                setHovered(null); // Hide tooltip when modal opens
              }}
              // Accessibility: make pins focusable and announce the location.
              // Enter/Space opens the modal, matching button behavior.
              role="button"
              tabIndex={0}
              aria-label={`${travel.name}, ${travel.country}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(travel);
                  setHovered(null);
                }
              }}
            />
          );
        })}
      </svg>

      {/*
        Tooltip — rendered as an HTML div positioned over the SVG.
        We use HTML (not SVG <text>) because it's much easier to style
        with Tailwind and handles text wrapping, fonts, etc. naturally.

        The tooltip is offset above and to the left of the cursor so it
        doesn't obscure the pin. pointer-events-none prevents it from
        interfering with mouse events on the pins below.
      */}
      {hovered && (
        <div
          className="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm text-sm"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            // Shift the tooltip up and left so it appears above the cursor.
            // translateX(-50%) centers it horizontally on the cursor.
            // translateY(-100%) plus -12px gap puts it above the pin.
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <p className="font-medium whitespace-nowrap">
            {hovered.name}, {hovered.country}
          </p>
          <p className="text-gray-500 text-xs whitespace-nowrap">
            {formatTravelDate(hovered.date, hovered.dateEnd)}
          </p>
        </div>
      )}

      {/*
        Modal — rendered when a pin is clicked.
        The modal manages its own <dialog> element; we just control
        whether it exists in the DOM via the `selected` state.
      */}
      {selected && (
        <TravelModal
          travel={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
