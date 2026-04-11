/**
 * travels.ts — Data loader and types for the /travels page.
 *
 * Travel data can come from two sources:
 *   1. Supabase "travels" table (primary, if configured)
 *   2. /data/travels.json (fallback, always available)
 *
 * This follows the same pattern as bookmarks and books in data-source.ts:
 * try Supabase first, fall back to the local file if Supabase isn't
 * configured or if the query fails.
 *
 * Why Supabase? Eventually some pins/info may be gated behind login
 * using Supabase Row Level Security (RLS). The JSON fallback ensures
 * the page still works without Supabase configured (e.g. local dev).
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";
import { unstable_cache } from "next/cache";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

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
};

// ---------------------------------------------------------------------
// Supabase helpers (same pattern as data-source.ts)
// ---------------------------------------------------------------------

/** Check if Supabase credentials are available in the environment. */
function useSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/** Create a Supabase client, or return null if credentials are missing. */
function getSupabase() {
  if (!useSupabase()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

/**
 * Map a raw Supabase row to our Travel type.
 * Supabase returns plain objects — this ensures consistent types
 * and handles any column name differences between the DB and our code.
 */
function rowToTravel(row: Record<string, unknown>): Travel {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    country: String(row.country ?? ""),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    date: String(row.date ?? ""),
    dateEnd: row.date_end ? String(row.date_end) : null,
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    recordSlug: row.record_slug ? String(row.record_slug) : null,
    note: row.note ? String(row.note) : null,
  };
}

// ---------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------

/** Fetch travels from Supabase. Falls back to JSON on error. */
async function fetchTravelsFromSupabase(): Promise<Travel[]> {
  const supabase = getSupabase();
  if (!supabase) return fetchTravelsFromJson();

  const { data, error } = await supabase
    .from("travels")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("[travels] Supabase error:", error.message);
    return fetchTravelsFromJson();
  }

  return (data ?? []).map(rowToTravel);
}

/**
 * Fetch travels from the local JSON file.
 * This is the fallback when Supabase isn't configured or fails.
 */
async function fetchTravelsFromJson(): Promise<Travel[]> {
  const filePath = path.join(process.cwd(), "data", "travels.json");
  const raw = await readFile(filePath, "utf8");
  const data: Travel[] = JSON.parse(raw);

  // Sort by date descending — most recent trips appear first.
  // String comparison works because dates are ISO-formatted (YYYY-MM or YYYY-MM-DD).
  return data.sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------
// Public API — cached data loader
// ---------------------------------------------------------------------

// Cache duration in seconds. Same as bookmarks/books (5 minutes).
const REVALIDATE_SECONDS = 300;

/**
 * Get all travel entries, sorted by date (most recent first).
 *
 * Uses Next.js unstable_cache to avoid re-fetching on every request.
 * The cache revalidates every 5 minutes — same cadence as bookmarks/books.
 *
 * Data source priority:
 *   1. Supabase "travels" table (if env vars are set)
 *   2. /data/travels.json (fallback)
 */
export const getTravels = unstable_cache(
  async (): Promise<Travel[]> => {
    return useSupabase()
      ? fetchTravelsFromSupabase()
      : fetchTravelsFromJson();
  },
  ["data-source-travels"],
  { revalidate: REVALIDATE_SECONDS }
);

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
