/**
 * /travels — Interactive travel map page.
 *
 * This is a server component that:
 *   1. Loads travel data from Supabase (or JSON fallback)
 *   2. Reads the world map SVG file from disk
 *   3. Passes both to the client-side TravelMap component
 *
 * The SVG is read server-side so the 1.2MB of path data stays out of
 * the JavaScript bundle — it's sent as static HTML in the RSC payload.
 *
 * Layout note: The map breaks out of the site's max-w-2xl container
 * to give the world map more breathing room, while the rest of the
 * page content stays within the normal container width.
 */

import type { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { getTravels } from "@/lib/travels";
import TravelMap from "./TravelMap";

export const metadata: Metadata = {
  title: "Emily Dela Cruz - Travels",
  description: "An interactive map of places I have visited.",
};

/**
 * Read the world map SVG and extract just the inner content (the <path> elements).
 * We strip the outer <svg> wrapper because TravelMap renders its own <svg>
 * element with the correct viewBox and our pin overlays.
 */
async function getMapSvgContent(): Promise<string> {
  const svgPath = path.join(process.cwd(), "public", "assets", "world-map.svg");
  const raw = await readFile(svgPath, "utf8");

  // Extract everything between the opening <svg ...> tag and closing </svg>.
  // This gives us just the <path> elements for each country.
  const match = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return match ? match[1] : "";
}

export default async function TravelsPage() {
  // Load travel data and SVG content in parallel
  const [travels, mapSvgContent] = await Promise.all([
    getTravels(),
    getMapSvgContent(),
  ]);

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-6">Travels</h1>

      {/*
        Map section: breaks out of the max-w-2xl parent container.
        The negative margins cancel out the parent's px-4 padding,
        then we re-add padding so the map doesn't touch screen edges.
        Hidden on mobile (< md breakpoint) — mobile users see the card list instead.
      */}
      <div className="hidden md:block -mx-4 w-[calc(100%+2rem)] lg:-mx-[calc((100vw-672px)/2)] lg:w-screen">
        <div className="max-w-5xl mx-auto px-4">
          <TravelMap travels={travels} mapSvgContent={mapSvgContent} />
        </div>
      </div>

      {/* Card list will be added in Phase 5 */}
    </main>
  );
}
