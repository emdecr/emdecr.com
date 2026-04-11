/**
 * travels.ts — Server-only data loader for the /travels page.
 *
 * This file contains Node.js imports (fs, path) and Supabase calls,
 * so it can ONLY be imported from server components or other server code.
 *
 * Client components should import types and utilities from
 * travel-types.ts instead, which has no server-only dependencies.
 *
 * Data sources (in priority order):
 *   1. Supabase "travels" table (if env vars are set)
 *   2. /data/travels.json (fallback, always available)
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";
import { unstable_cache } from "next/cache";

// Re-export types so server components can import everything from one place.
// Client components should import directly from travel-types.ts.
export type { Travel, TravelStatus } from "./travel-types";

import type { Travel, TravelStatus } from "./travel-types";

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
    status: (row.status === "wishlist" ? "wishlist" : "visited") as TravelStatus,
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

// Re-export formatTravelDate so server components can import from one place.
export { formatTravelDate } from "./travel-types";
