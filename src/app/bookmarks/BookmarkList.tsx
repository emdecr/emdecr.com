"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "@/lib/bookmarks";

export default function BookmarkList({ allBookmarks }: { allBookmarks: Bookmark[] }) {
  const searchParams = useSearchParams();
  const PER_PAGE = 12;
  const page = parseInt(searchParams.get("page") || "1", 10);

  const total = allBookmarks.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const bookmarks = allBookmarks.slice(start, start + PER_PAGE);

  return (
    <main className="prose max-w-none">
      <h1>Bookmarks</h1>

      <ul className="not-prose list-none pl-0 space-y-6">
        {bookmarks.map((b, i) => (
          <li key={`${b.bookmark_link}-${i}`} className="border-b border-neutral-200 pb-6 last:border-b-0">
            <a href={b.bookmark_link} target="_blank" rel="noopener noreferrer" className="no-underline">
              <h2 className="text-xl font-semibold mb-2">{b.bookmark_title}</h2>
            </a>

            <p className="text-sm text-gray-500 mb-2">
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour12: true,
              }).format(new Date(b.bookmark_date))}
            </p>

            {b.bookmark_note && (
              <p className="text-sm text-gray-700 mb-2">{b.bookmark_note}</p>
            )}

            {b.bookmark_image && (
              <Image
                src={b.bookmark_image}
                alt=""
                width={400}
                height={200}
                className="mt-2 rounded object-cover"
                style={{ width: "100%", height: "auto", maxHeight: "12rem" }}
                unoptimized // Optional if image host isn't in next.config.js
              />
            )}
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <nav aria-label="Pagination" className="not-prose flex justify-between items-center mt-8">
        {page <= 1 ? (
          <span
            className="px-4 py-2 bg-gray-200 rounded inline-flex items-center opacity-50"
            aria-disabled="true"
          >
            Previous
          </span>
        ) : (
          <Link
            href={`?page=${page - 1}`}
            className="px-4 py-2 bg-gray-200 rounded inline-flex items-center"
            aria-label="Previous page"
          >
            Previous
          </Link>
        )}
        <p className="text-sm">Page {page} of {totalPages}</p>
        {page >= totalPages ? (
          <span
            className="px-4 py-2 bg-gray-200 rounded inline-flex items-center opacity-50"
            aria-disabled="true"
          >
            Next
          </span>
        ) : (
          <Link
            href={`?page=${page + 1}`}
            className="px-4 py-2 bg-gray-200 rounded inline-flex items-center"
            aria-label="Next page"
          >
            Next
          </Link>
        )}
      </nav>
    </main>
  );
}