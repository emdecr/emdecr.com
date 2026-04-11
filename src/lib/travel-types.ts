/**
 * travel-types.ts — Shared types and utilities for the /travels page.
 *
 * This file is safe to import from both server and client components.
 * It contains NO Node.js-only imports (fs, path, etc.) so the bundler
 * won't choke when a client component imports from here.
 *
 * The server-only data fetching lives in travels.ts, which imports
 * these types but also uses fs/Supabase (not client-safe).
 */

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

// The two types of travel pins:
//   - "visited"  = places you've actually been (solid pin)
//   - "wishlist" = places you want to go (outline/different style pin)
export type TravelStatus = "visited" | "wishlist";

export type Travel = {
  id: string; // Unique kebab-case identifier, e.g. "london-2024"
  name: string; // Display name: city, region, or area
  country: string; // Country or state name
  lat: number; // Latitude in decimal degrees (north is positive)
  lng: number; // Longitude in decimal degrees (east is positive)
  date: string; // Start date as partial ISO: "2024-03" or "2024-03-15"
  dateEnd?: string | null; // End date (same format), null/omitted for single dates
  images?: string[]; // Array of image paths relative to /public
  recordSlug?: string | null; // Slug for linking to /records/[slug], null if no article
  note?: string | null; // Short one-line description for tooltip and card
  status: TravelStatus; // "visited" or "wishlist" — controls pin styling
};

// ---------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------

/**
 * Format a travel date (or date range) for display.
 *
 * Handles two formats:
 *   - "2024-03"    → "Mar 2024"
 *   - "2024-03-15" → "Mar 15, 2024"
 *
 * If dateEnd is provided and differs from date, shows a range:
 *   - "Mar 2024 – Apr 2024"
 *   - "Mar 15, 2024 – Apr 2, 2024"
 */
export function formatTravelDate(
  date: string,
  dateEnd?: string | null
): string {
  const fmt = (d: string): string => {
    const parts = d.split("-");

    if (parts.length === 2) {
      // Year-month only: "2024-03" → "Mar 2024"
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1);
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }

    // Full date: "2024-03-15" → "Mar 15, 2024"
    // Note: we parse parts manually to avoid timezone issues with new Date("2024-03-15")
    const dateObj = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // If there's no end date, or end date matches start date, just show the single date
  if (!dateEnd || dateEnd === date) {
    return fmt(date);
  }

  // Show as a range: "Mar 2024 – Apr 2024"
  return `${fmt(date)} – ${fmt(dateEnd)}`;
}
