/**
 * TravelModal — Dialog that opens when you click a map pin.
 *
 * Uses the native HTML <dialog> element, which gives us:
 *   - Built-in backdrop (the dimmed overlay behind the modal)
 *   - Focus trapping (Tab stays within the modal while open)
 *   - Escape key to close
 *   - Proper aria roles by default
 *
 * Content shown:
 *   - Location name + country
 *   - Date or date range
 *   - Status badge (visited vs wishlist)
 *   - Optional note
 *   - Image slider (CSS scroll-snap, no library needed)
 *   - Optional "Read more" link to /records/[slug]
 *
 * Image slider approach:
 *   Instead of a JS-heavy carousel library, we use CSS scroll-snap.
 *   The container has overflow-x: auto with snap points, so swiping
 *   or scrolling snaps to each image. Prev/next buttons call
 *   scrollBy() on the container ref for click-based navigation.
 *   This works great on mobile (native swipe) and desktop (buttons).
 */

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatTravelDate } from "@/lib/travel-types";
import type { Travel } from "@/lib/travel-types";

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

type TravelModalProps = {
  travel: Travel;
  onClose: () => void;
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function TravelModal({ travel, onClose }: TravelModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Open the dialog as a modal when the component mounts.
  // showModal() (vs show()) enables the backdrop and focus trapping.
  //
  // Note: we don't return a cleanup function that calls dialog.close()
  // because React strict mode in dev double-mounts effects, which would
  // immediately close the dialog after opening it. Instead, we rely on
  // the onClose prop and the dialog's native Escape key behavior.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const hasImages = travel.images && travel.images.length > 0;
  const hasMultipleImages = travel.images && travel.images.length > 1;

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
      // The onClose event fires when the dialog is closed via Escape key
      // or dialog.close(). We sync this with React state via onClose prop.
      onClose={onClose}
      // Clicking the backdrop (the ::backdrop pseudo-element) should close
      // the modal. We detect this by checking if the click target is the
      // dialog element itself (not its children).
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
      {/* Close button — positioned in the top-right corner, outside the padding */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Close modal"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>

      {/*
        Image slider — only shown if the travel entry has images.
        Uses CSS scroll-snap for smooth, native-feeling snapping.
      */}
      {hasImages && (
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
          >
            {travel.images!.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${travel.name} photo ${i + 1}`}
                className="snap-start w-full shrink-0 object-cover aspect-[16/9] rounded-t-lg"
              />
            ))}
          </div>

          {/* Prev/Next buttons — only shown if there are multiple images */}
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

      {/* Text content — location details */}
      <div className="p-5">
        {/* Status badge */}
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${
            travel.status === "wishlist"
              ? "bg-gray-100 text-gray-600"
              : "bg-black text-white"
          }`}
        >
          {travel.status === "wishlist" ? "Wishlist" : "Visited"}
        </span>

        {/* Location name — padded right to avoid the close button */}
        <h2 className="text-lg font-semibold pr-8">
          {travel.name}, {travel.country}
        </h2>

        {/* Date or date range */}
        <p className="text-sm text-gray-500 mt-1">
          {formatTravelDate(travel.date, travel.dateEnd)}
        </p>

        {/* Optional note */}
        {travel.note && (
          <p className="text-sm mt-3">{travel.note}</p>
        )}

        {/* Optional link to a /records article */}
        {travel.recordSlug && (
          <Link
            href={`/records/${travel.recordSlug}`}
            className="inline-block text-sm underline mt-3 hover:text-gray-600 transition-colors"
          >
            Read more
          </Link>
        )}
      </div>
    </dialog>
  );
}
