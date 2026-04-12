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
 *   - Scroll wheel: zoom in/out centered on cursor position
 *   - Click + drag: pan the map when zoomed in
 *   - +/− buttons: zoom in/out centered on the map
 *   - Reset button: return to the full (unzoomed) map view
 *
 * Zoom & Pan approach:
 *   The SVG has a viewBox that defines the visible region. By default it
 *   shows the full map (0 0 1009.67 665.96). To zoom in, we shrink the
 *   viewBox dimensions (showing a smaller region = zooming in). To pan,
 *   we shift the viewBox origin (x, y).
 *
 *   Camera state is stored as { centerX, centerY, zoom } where center is
 *   the SVG coordinate at the middle of the viewport and zoom is a
 *   multiplier (1 = full map, 8 = 8x zoom). The viewBox is computed from
 *   this state: width = fullWidth / zoom, height = fullHeight / zoom,
 *   x = centerX - width/2, y = centerY - height/2.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { latLngToSvgPoint, SVG_WIDTH, SVG_HEIGHT } from "@/lib/map-projection";
// Import from travel-types.ts (not travels.ts) because travels.ts
// contains Node.js imports (fs, path) that can't be bundled for the client.
import type { GroupedTravel } from "@/lib/travel-types";
import TravelModal from "./TravelModal";

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

/** Minimum zoom level — shows the full map. */
const MIN_ZOOM = 1;

/** Maximum zoom level — 8x magnification. */
const MAX_ZOOM = 8;

/**
 * How much the zoom changes per scroll wheel tick or button click.
 * 1.3 means each step zooms by 30% — feels natural without being jarring.
 */
const ZOOM_STEP = 1.3;

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

/**
 * Camera state for zoom/pan.
 *
 * centerX, centerY — the SVG coordinate at the center of the viewport.
 * zoom — multiplier (1 = full map, 2 = 2x zoom, etc.)
 *
 * We store the center point (not the top-left corner) because it makes
 * zoom-toward-cursor math simpler: the center moves toward the cursor
 * when zooming in, and the viewBox is derived from the center.
 */
type Camera = {
  centerX: number;
  centerY: number;
  zoom: number;
};

// Starting camera state — centered on the map, fully zoomed out.
const DEFAULT_CAMERA: Camera = {
  centerX: SVG_WIDTH / 2,
  centerY: SVG_HEIGHT / 2,
  zoom: 1,
};

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/**
 * Compute the SVG viewBox string from the camera state.
 *
 * viewBox = "x y width height" where:
 *   - width/height = full dimensions divided by zoom level
 *   - x/y = center minus half the width/height
 */
function cameraToViewBox(cam: Camera): string {
  const w = SVG_WIDTH / cam.zoom;
  const h = SVG_HEIGHT / cam.zoom;
  const x = cam.centerX - w / 2;
  const y = cam.centerY - h / 2;
  return `${x} ${y} ${w} ${h}`;
}

/**
 * Clamp the camera so the viewBox doesn't scroll past the map edges.
 *
 * Without clamping, you could pan until the map is entirely off-screen.
 * We constrain the center so the viewBox stays within [0, SVG_WIDTH] x
 * [0, SVG_HEIGHT]. At zoom=1 the center is locked to the middle (no panning).
 */
function clampCamera(cam: Camera): Camera {
  const zoom = Math.min(Math.max(cam.zoom, MIN_ZOOM), MAX_ZOOM);
  const halfW = SVG_WIDTH / zoom / 2;
  const halfH = SVG_HEIGHT / zoom / 2;

  // The center must be at least halfW from the left edge and at most
  // SVG_WIDTH - halfW from the left edge (and same for Y).
  const centerX = Math.min(Math.max(cam.centerX, halfW), SVG_WIDTH - halfW);
  const centerY = Math.min(Math.max(cam.centerY, halfH), SVG_HEIGHT - halfH);

  return { centerX, centerY, zoom };
}

/**
 * Convert a pixel position on the rendered SVG element to SVG coordinates.
 *
 * The SVG element is rendered at some pixel size (say 800x528 on screen)
 * but represents a larger coordinate space (1009.67 x 665.96). When the
 * user scrolls at pixel (400, 264), we need to know which SVG coordinate
 * that corresponds to — so we can zoom toward that point.
 *
 * @param clientX - Mouse X relative to the viewport (e.clientX)
 * @param clientY - Mouse Y relative to the viewport (e.clientY)
 * @param svgRect - Bounding rect of the <svg> element
 * @param camera  - Current camera state (to know the visible region)
 */
function clientToSvgCoords(
  clientX: number,
  clientY: number,
  svgRect: DOMRect,
  camera: Camera
): { svgX: number; svgY: number } {
  // Where is the cursor within the SVG element, as a fraction 0..1?
  const fracX = (clientX - svgRect.left) / svgRect.width;
  const fracY = (clientY - svgRect.top) / svgRect.height;

  // What SVG coordinate region is currently visible?
  const viewW = SVG_WIDTH / camera.zoom;
  const viewH = SVG_HEIGHT / camera.zoom;
  const viewX = camera.centerX - viewW / 2;
  const viewY = camera.centerY - viewH / 2;

  // Map the fraction to SVG coordinates within the visible region.
  return {
    svgX: viewX + fracX * viewW,
    svgY: viewY + fracY * viewH,
  };
}

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

  // Camera state for zoom/pan. Starts fully zoomed out showing the whole map.
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);

  // Ref to the wrapper div — we use it to calculate tooltip position
  // relative to the container (not the page).
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Ref to the <svg> element — used for coordinate conversion in zoom/pan.
  const svgRef = useRef<SVGSVGElement>(null);

  // Drag state — stored in a ref (not state) because we don't want to
  // re-render on every mousemove during a drag. Instead, we update the
  // camera state directly, which triggers a single re-render.
  const dragRef = useRef<{
    isDragging: boolean;
    // The SVG coordinate under the cursor when the drag started.
    // We keep this fixed and move the camera so the same map point
    // stays under the cursor throughout the drag.
    startSvgX: number;
    startSvgY: number;
    // Starting camera center — we offset from here during the drag.
    startCameraX: number;
    startCameraY: number;
  }>({
    isDragging: false,
    startSvgX: 0,
    startSvgY: 0,
    startCameraX: 0,
    startCameraY: 0,
  });

  // Are we zoomed in? Used to decide whether to show reset button
  // and to change the cursor style (grab hand when panning is available).
  const isZoomed = camera.zoom > 1.05; // Small epsilon to avoid float issues

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

  // -------------------------------------------------------------------
  // Zoom handlers
  // -------------------------------------------------------------------

  /**
   * Zoom the map centered on a specific SVG coordinate.
   *
   * When zooming toward a point, the camera center moves toward that
   * point proportionally. The math:
   *   newCenter = point + (oldCenter - point) * (oldZoom / newZoom)
   *
   * This ensures the point under the cursor stays in the same screen
   * position after zooming — which feels natural and intuitive.
   */
  const zoomAtPoint = useCallback(
    (svgX: number, svgY: number, newZoom: number) => {
      setCamera((prev) => {
        const clampedZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
        const scale = prev.zoom / clampedZoom;

        return clampCamera({
          centerX: svgX + (prev.centerX - svgX) * scale,
          centerY: svgY + (prev.centerY - svgY) * scale,
          zoom: clampedZoom,
        });
      });
    },
    []
  );

  /**
   * Zoom centered on the middle of the current view.
   * Used by the +/− buttons (no cursor position to anchor to).
   */
  const zoomAtCenter = useCallback(
    (direction: "in" | "out") => {
      setCamera((prev) => {
        const newZoom =
          direction === "in"
            ? prev.zoom * ZOOM_STEP
            : prev.zoom / ZOOM_STEP;

        return clampCamera({
          ...prev,
          zoom: Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM),
        });
      });
    },
    []
  );

  /** Reset to the full map view. */
  const resetZoom = useCallback(() => {
    setCamera(DEFAULT_CAMERA);
  }, []);

  /**
   * Scroll wheel handler — zoom toward the cursor position.
   *
   * We prevent the default scroll behavior so the page doesn't scroll
   * while the user is zooming the map. deltaY > 0 = scroll down = zoom out.
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();

      // Get the current camera for coordinate conversion.
      // We read from the state updater to avoid stale closures.
      setCamera((prev) => {
        const { svgX, svgY } = clientToSvgCoords(
          e.clientX,
          e.clientY,
          rect,
          prev
        );

        // Zoom in or out based on scroll direction
        const direction = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
        const newZoom = Math.min(
          Math.max(prev.zoom * direction, MIN_ZOOM),
          MAX_ZOOM
        );

        // Move camera center toward/away from the cursor point
        const scale = prev.zoom / newZoom;
        return clampCamera({
          centerX: svgX + (prev.centerX - svgX) * scale,
          centerY: svgY + (prev.centerY - svgY) * scale,
          zoom: newZoom,
        });
      });
    },
    []
  );

  // -------------------------------------------------------------------
  // Drag-to-pan handlers
  // -------------------------------------------------------------------

  /**
   * Start a drag operation. We record the SVG coordinate under the cursor
   * and the current camera center. During the drag, we'll compute how far
   * the cursor has moved in SVG units and shift the camera accordingly.
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Only pan when zoomed in, and only on left mouse button / primary touch
      if (!isZoomed || e.button !== 0) return;

      const svg = svgRef.current;
      if (!svg) return;

      // Capture the pointer so we get move/up events even outside the SVG
      svg.setPointerCapture(e.pointerId);

      const rect = svg.getBoundingClientRect();

      // Use the latest camera state from the ref-based approach
      setCamera((prev) => {
        const { svgX, svgY } = clientToSvgCoords(
          e.clientX,
          e.clientY,
          rect,
          prev
        );

        dragRef.current = {
          isDragging: true,
          startSvgX: svgX,
          startSvgY: svgY,
          startCameraX: prev.centerX,
          startCameraY: prev.centerY,
        };

        return prev; // Don't change camera yet
      });
    },
    [isZoomed]
  );

  /**
   * During a drag: compute how far the cursor has moved in SVG coordinates
   * and shift the camera center by that amount (in the opposite direction,
   * since dragging right should move the map right = camera moves left).
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current.isDragging) return;

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();

      setCamera((prev) => {
        const { svgX, svgY } = clientToSvgCoords(
          e.clientX,
          e.clientY,
          rect,
          prev
        );

        // How far has the cursor moved in SVG units since the drag started?
        // We use the difference between the current SVG point and the start
        // SVG point, then apply that delta to the starting camera center.
        //
        // Why not just "current - previous frame"? Because floating point
        // drift accumulates across many small moves. Anchoring to the start
        // position keeps the map point locked under the cursor.
        const drag = dragRef.current;

        return clampCamera({
          centerX: drag.startCameraX + (drag.startSvgX - svgX),
          centerY: drag.startCameraY + (drag.startSvgY - svgY),
          zoom: prev.zoom,
        });
      });
    },
    []
  );

  /** End a drag operation. */
  const handlePointerUp = useCallback(() => {
    dragRef.current.isDragging = false;
  }, []);

  return (
    // Wrapper div with position:relative so the tooltip (position:absolute)
    // and zoom controls are positioned relative to the map, not the page.
    <div ref={wrapperRef} className="relative">
      <svg
        ref={svgRef}
        viewBox={cameraToViewBox(camera)}
        xmlns="http://www.w3.org/2000/svg"
        // When zoomed in, show a grab cursor to indicate panning.
        // "grabbing" is applied via the active pseudo-class below.
        className={`w-full h-auto select-none ${
          isZoomed ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        role="img"
        aria-label="World map with travel location pins"
        // Zoom: scroll wheel zooms toward the cursor
        onWheel={handleWheel}
        // Pan: pointer events for drag-to-pan
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Prevent touch scrolling on the map when zoomed — we want
        // touch gestures to pan the map, not scroll the page.
        style={isZoomed ? { touchAction: "none" } : undefined}
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

          Pin radius is divided by zoom so pins stay the same visual
          size regardless of zoom level. Without this, zooming in
          would make pins huge (since the viewBox is smaller but the
          circle radius stays the same in SVG units).
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
              r={5 / camera.zoom}
              // Visited pins are solid black, wishlist pins are outlined.
              // Both turn red on hover for a consistent interactive feel.
              className={`cursor-pointer transition-colors hover:fill-red-500 ${
                location.status === "wishlist"
                  ? "fill-white stroke-black stroke-[1.5]"
                  : "fill-black"
              }`}
              // Scale stroke width with zoom too (for wishlist outlined pins)
              strokeWidth={location.status === "wishlist" ? 1.5 / camera.zoom : undefined}
              // Hover handlers: show/hide the tooltip and track cursor position
              onMouseEnter={(e) => {
                setHovered(location);
                updateTooltipPosition(e);
              }}
              onMouseMove={updateTooltipPosition}
              onMouseLeave={() => setHovered(null)}
              // Click handler: open the detail modal for this location.
              // stopPropagation prevents this from triggering a drag.
              onClick={(e) => {
                e.stopPropagation();
                setSelected(location);
                setHovered(null); // Hide tooltip when modal opens
              }}
              // Accessibility: make pins focusable and announce the location.
              // Enter/Space opens the modal, matching button behavior.
              role="button"
              tabIndex={0}
              aria-label={`${location.name}, ${location.country}${tripCount > 1 ? ` — ${tripCount} trips` : ""}`}
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
        Zoom controls — +, −, and reset buttons overlaid on the bottom-right.
        These are HTML elements (not SVG) so they stay at a fixed pixel size
        and position regardless of map zoom level.
      */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => zoomAtCenter("in")}
          disabled={camera.zoom >= MAX_ZOOM}
          className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => zoomAtCenter("out")}
          disabled={camera.zoom <= MIN_ZOOM}
          className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          aria-label="Zoom out"
        >
          −
        </button>
        {/* Reset button — only shown when zoomed in */}
        {isZoomed && (
          <button
            onClick={resetZoom}
            className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-xs transition-colors"
            aria-label="Reset map zoom"
            title="Reset zoom"
          >
            {/* Simple "fit" icon — a square with arrows pointing inward */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="12" height="12" rx="1" />
              <path d="M5 3L3 3L3 5" />
              <path d="M9 3L11 3L11 5" />
              <path d="M5 11L3 11L3 9" />
              <path d="M9 11L11 11L11 9" />
            </svg>
          </button>
        )}
      </div>

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
                : "1 trip"
              : `${hovered.trips.length} trips`}
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
