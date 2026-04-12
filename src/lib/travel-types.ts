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
// Grouped travel type
// ---------------------------------------------------------------------

/**
 * A GroupedTravel represents a single location on the map that may
 * have been visited multiple times (e.g. 5 trips to Montreal).
 *
 * The map shows one pin per GroupedTravel, and the modal shows all
 * visits as a list. This keeps the map clean while preserving the
 * full trip history.
 */
export type GroupedTravel = {
  name: string; // Location name used as the grouping key
  country: string; // Country (from the most recent trip)
  lat: number; // Coordinates (from the most recent trip)
  lng: number;
  status: TravelStatus; // "visited" if ANY trip is visited, else "wishlist"
  trips: Travel[]; // All trips to this location, sorted by date (newest first)
  images: string[]; // All images from all trips, combined
  recordSlugs: string[]; // All unique record slugs across trips
};

/**
 * Group an array of travel entries by location name.
 *
 * Trips to the same city (matching `name`) are merged into a single
 * GroupedTravel. The most recent trip provides the coordinates and
 * country name. Images and record slugs are combined from all trips.
 *
 * @param travels - Flat array of travel entries, should be pre-sorted by date (newest first)
 * @returns Array of grouped locations, sorted by most recent visit date
 */
export function groupTravelsByLocation(travels: Travel[]): GroupedTravel[] {
  // Use a Map to group trips by location name.
  // Since travels are already sorted newest-first, the first entry
  // we encounter for each name is the most recent trip.
  const groups = new Map<string, GroupedTravel>();

  for (const travel of travels) {
    const existing = groups.get(travel.name);

    if (existing) {
      // Add this trip to the existing group
      existing.trips.push(travel);

      // Merge images from this trip into the group's combined list
      if (travel.images && travel.images.length > 0) {
        existing.images.push(...travel.images);
      }

      // Collect unique record slugs
      if (travel.recordSlug && !existing.recordSlugs.includes(travel.recordSlug)) {
        existing.recordSlugs.push(travel.recordSlug);
      }

      // If any trip is "visited", the group is "visited"
      // (a wishlist location becomes visited once you go there)
      if (travel.status === "visited") {
        existing.status = "visited";
      }
    } else {
      // First time seeing this location — create a new group.
      // Since travels are sorted newest-first, this trip's coordinates
      // and country become the group's primary values.
      groups.set(travel.name, {
        name: travel.name,
        country: travel.country,
        lat: travel.lat,
        lng: travel.lng,
        status: travel.status,
        trips: [travel],
        images: travel.images ? [...travel.images] : [],
        recordSlugs: travel.recordSlug ? [travel.recordSlug] : [],
      });
    }
  }

  // Convert the Map to an array. Order is preserved (Map iterates
  // in insertion order), and since we iterated newest-first, the
  // groups are already sorted by most recent visit.
  return Array.from(groups.values());
}

/**
 * Group travel entries by country for the card list.
 *
 * Unlike groupTravelsByLocation (which groups by city for map pins),
 * this groups by country so the card list shows "Canada" instead of
 * separate cards for Montreal and Toronto. Avoids awkward "Singapore,
 * Singapore" type entries too.
 *
 * The modal for a country card lists each individual trip (city + date).
 *
 * @param travels - Flat array of travel entries, pre-sorted by date (newest first)
 * @returns Array of grouped countries, sorted by most recent visit date
 */
export function groupTravelsByCountry(travels: Travel[]): GroupedTravel[] {
  const groups = new Map<string, GroupedTravel>();

  for (const travel of travels) {
    const existing = groups.get(travel.country);

    if (existing) {
      existing.trips.push(travel);

      if (travel.images && travel.images.length > 0) {
        existing.images.push(...travel.images);
      }

      if (travel.recordSlug && !existing.recordSlugs.includes(travel.recordSlug)) {
        existing.recordSlugs.push(travel.recordSlug);
      }

      if (travel.status === "visited") {
        existing.status = "visited";
      }
    } else {
      // Use the country name as the display name for the card.
      // Lat/lng from the first (most recent) trip — used if the card
      // ever needs coordinates, but mainly it's for the modal.
      groups.set(travel.country, {
        name: travel.country,
        country: travel.country,
        lat: travel.lat,
        lng: travel.lng,
        status: travel.status,
        trips: [travel],
        images: travel.images ? [...travel.images] : [],
        recordSlugs: travel.recordSlug ? [travel.recordSlug] : [],
      });
    }
  }

  return Array.from(groups.values());
}

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
