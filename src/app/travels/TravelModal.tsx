/**
 * TravelModal — Dialog that opens when you click a map pin or card.
 *
 * Now receives a GroupedTravel (one location, possibly many trips).
 * For locations with multiple visits, it shows a visit history list
 * with dates and notes for each trip.
 *
 * Uses the native HTML <dialog> element, which gives us:
 *   - Built-in backdrop (the dimmed overlay behind the modal)
 *   - Focus trapping (Tab stays within the modal while open)
 *   - Escape key to close
 *   - Proper aria roles by default
 *
 * Image slider approach:
 *   Uses CSS scroll-snap — the container has overflow-x: auto with snap
 *   points, so swiping or scrolling snaps to each image. Prev/next
 *   buttons call scrollBy() for click-based navigation.
 */

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatTravelDate } from "@/lib/travel-types";
import type { GroupedTravel } from "@/lib/travel-types";

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

type TravelModalProps = {
  location: GroupedTravel;
  onClose: () => void;
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function TravelModal({ location, onClose }: TravelModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Open the dialog as a modal when the component mounts.
  // showModal() (vs show()) enables the backdrop and focus trapping.
  //
  // Note: no cleanup function — React strict mode in dev double-mounts
  // effects, which would immediately close the dialog after opening it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const hasImages = location.images.length > 0;
  const hasMultipleImages = location.images.length > 1;
  const tripCount = location.trips.length;
  const hasMultipleTrips = tripCount > 1;

  /**
   * Scroll the image slider by one full image width.
   * direction: -1 = previous, 1 = next
   */
  const scrollSlider = (direction: number) => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.offsetWidth;
    sliderRef.current.scrollBy({ left: direction * width, behavior: "smooth" });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Clicking the backdrop closes the modal. We detect this by
      // checking if the click target is the dialog element itself.
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="
        backdrop:bg-black/50
        bg-white rounded-lg p-0 m-auto
        max-w-lg w-[calc(100%-2rem)]
        shadow-xl
        open:animate-[fadeIn_150ms_ease-out]
      "
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Close modal"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>

      {/* Image slider — combines images from all trips to this location */}
      {hasImages && (
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
          >
            {location.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${location.name} photo ${i + 1}`}
                // Lazy-load images beyond the first one (the first is visible immediately).
                loading={i === 0 ? "eager" : "lazy"}
                className="snap-start w-full shrink-0 object-cover aspect-[16/9] rounded-t-lg"
              />
            ))}
          </div>

          {hasMultipleImages && (
            <>
              <button
                onClick={() => scrollSlider(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 shadow transition-colors"
                aria-label="Previous image"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2L4 6l4 4" />
                </svg>
              </button>
              <button
                onClick={() => scrollSlider(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 shadow transition-colors"
                aria-label="Next image"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 2l4 4-4 4" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Text content */}
      <div className="p-5">
        {/* Status badge + visit count */}
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${
            location.status === "wishlist"
              ? "bg-gray-100 text-gray-600"
              : "bg-black text-white"
          }`}
        >
          {location.status === "wishlist"
            ? "Wishlist"
            : hasMultipleTrips
              ? `${tripCount} trips`
              : "Visited"}
        </span>

        {/* Location name — avoid "Singapore, Singapore" when name === country */}
        <h2 className="text-lg font-semibold pr-8">
          {location.name === location.country
            ? location.name
            : `${location.name}, ${location.country}`}
        </h2>

        {/*
          Visit history — if there are multiple trips, show each one
          as a line item with date and optional note. For single trips,
          just show the date and note inline.
        */}
        {hasMultipleTrips ? (
          <ul className="mt-3 space-y-2 list-none p-0 m-0">
            {location.trips.map((trip) => {
              // Show the city name if it differs from the group name.
              // e.g. for a "Canada" card, show "Montreal" or "Toronto"
              // before the date. For a "Montreal" pin, skip it.
              const showCity = trip.name !== location.name;

              return (
                <li key={trip.id} className="text-sm border-l-2 border-gray-200 pl-3">
                  {showCity && (
                    <p className="font-medium">{trip.name}</p>
                  )}
                  <p className="text-gray-500">
                    {formatTravelDate(trip.date, trip.dateEnd)}
                  </p>
                  {trip.note && (
                    <p className="text-gray-700 mt-0.5">{trip.note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            {/* Single trip: show date and note directly */}
            <p className="text-sm text-gray-500 mt-1">
              {formatTravelDate(location.trips[0].date, location.trips[0].dateEnd)}
            </p>
            {location.trips[0].note && (
              <p className="text-sm mt-3">{location.trips[0].note}</p>
            )}
          </>
        )}

        {/* Links to /records articles (from any trip to this location) */}
        {location.recordSlugs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {location.recordSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/records/${slug}`}
                className="inline-block text-sm underline hover:text-gray-600 transition-colors"
              >
                Read more
              </Link>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
