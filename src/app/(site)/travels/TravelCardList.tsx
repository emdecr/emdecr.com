/**
 * TravelCardList — Grid of travel location cards shown below the map.
 *
 * Split into two sections:
 *   1. Visited locations — cards with dates and visit counts
 *   2. Wishlist locations — simpler cards under a "Want to Visit" heading
 *
 * Receives GroupedTravel data grouped by country. Clicking a card opens
 * the TravelModal with full trip details.
 *
 * On mobile (where the map is hidden), this is the primary way to
 * browse travel locations.
 */

"use client";

import { useState } from "react";
import { formatTravelDate } from "@/lib/travel-types";
import type { GroupedTravel } from "@/lib/travel-types";
import TravelModal from "./TravelModal";

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

type TravelCardListProps = {
  locations: GroupedTravel[];
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function TravelCardList({ locations }: TravelCardListProps) {
  const [selected, setSelected] = useState<GroupedTravel | null>(null);

  // Split locations into visited and wishlist groups.
  // A country is "wishlist" only if ALL its trips are wishlist.
  // (groupTravelsByCountry already handles this — status is "visited"
  // if any trip is visited.)
  const visited = locations.filter((l) => l.status === "visited");
  const wishlist = locations.filter((l) => l.status === "wishlist");

  return (
    <>
      {/* Visited locations — cards with dates and visit counts */}
      <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {visited.map((location) => {
          const hasThumbnail = location.images.length > 0;
          const tripCount = location.trips.length;
          const latestTrip = location.trips[0];

          return (
            <li key={location.name}>
              <button
                onClick={() => setSelected(location)}
                className="w-full text-left border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 transition-colors cursor-pointer"
              >
                {hasThumbnail && (
                  <img
                    src={location.images[0]}
                    alt=""
                    loading="lazy"
                    className="w-full aspect-[16/9] object-cover"
                  />
                )}

                <div className="p-3">
                  {/* Status dot + country name */}
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0 bg-black"
                      aria-hidden="true"
                    />
                    <p className="font-medium text-sm">
                      {location.name === location.country
                        ? location.name
                        : `${location.name}, ${location.country}`}
                    </p>
                  </div>

                  {/* Date + trip count */}
                  <p className="text-xs text-gray-500 mt-1 ml-4">
                    {tripCount > 1
                      ? `${tripCount} trips · Last: ${formatTravelDate(latestTrip.date, latestTrip.dateEnd)}`
                      : formatTravelDate(latestTrip.date, latestTrip.dateEnd)}
                  </p>

                  {/* Record link hint */}
                  {location.recordSlugs.length > 0 && (
                    <p className="text-xs underline mt-1 ml-4">Read more</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Wishlist locations — simpler cards, no dates */}
      {wishlist.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-10 mb-4">Want to Visit</h2>
          <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlist.map((location) => (
              <li key={location.name}>
                <button
                  onClick={() => setSelected(location)}
                  className="w-full text-left border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0 border border-black"
                        aria-hidden="true"
                      />
                      <p className="font-medium text-sm">
                        {location.name === location.country
                          ? location.name
                          : `${location.name}, ${location.country}`}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Modal — same component used by TravelMap */}
      {selected && (
        <TravelModal
          location={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
