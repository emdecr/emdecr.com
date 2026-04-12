/**
 * /travels — Interactive travel map page.
 *
 * This is a server component that:
 *   1. Loads travel data from Supabase (or JSON fallback)
 *   2. Groups trips by location (so 5x Montreal = 1 pin)
 *   3. Reads the world map SVG file from disk
 *   4. Passes grouped data + SVG to client components
 *
 * The SVG is read server-side so the ~600KB of path data stays out of
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
import { groupTravelsByLocation, groupTravelsByCountry } from "@/lib/travel-types";
import TravelMap from "./TravelMap";
import TravelCardList from "./TravelCardList";

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

  // Map pins: group by city name (Montreal, Toronto get separate pins)
  const locationGroups = groupTravelsByLocation(travels);

  // Card list: group by country (Canada shows once, listing Montreal + Toronto trips)
  // This avoids awkward cards like "Singapore, Singapore" and keeps the list concise.
  const countryGroups = groupTravelsByCountry(travels);

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-6">Travels</h1>

      {/*
        Map section: breaks out of the max-w-2xl parent container.

        The breakout uses negative margins to widen beyond the parent,
        paired with a max-width so it doesn't exceed the viewport.
        - md: slight breakout (adds ~200px total width)
        - lg+: larger breakout, capped at max-w-5xl

        We avoid 100vw because it includes scrollbar width and causes
        horizontal overflow on Windows/Linux browsers.
      */}
      <div className="hidden md:block -mx-24 lg:-mx-40">
        <div className="max-w-5xl mx-auto px-4">
          <TravelMap locations={locationGroups} mapSvgContent={mapSvgContent} />
        </div>
      </div>

      {/* Card list — always visible, including on mobile where the map is hidden */}
      <TravelCardList locations={countryGroups} />
    </main>
  );
}
