"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "@/lib/bookmarks";

export default function BookmarkList({ allBookmarks }: { allBookmarks: Bookmark[] }) {
  const searchParams = useSearchParams();
  const PER_PAGE = 12;
  const page = parseInt(searchParams.get("page") || "1", PER_PAGE);  

  const total = allBookmarks.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const bookmarks = allBookmarks.slice(start, start + PER_PAGE);

  return (
    <main className="">
      <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>

      <ul className="grid gap-4 grid-cols-3 grid-rows-3">
        {bookmarks.map((b, i) => (
          <li key={`${b.bookmark_link}-${i}`} className="border border-neutral-300 p-4 rounded">
            <a href={b.bookmark_link} target="_blank" rel="noopener noreferrer">
              <h2 className="text-lg font-semibold text-blue-600">{b.bookmark_title}</h2>
            </a>

            <p className="text-sm text-gray-400">
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour12: true,
              }).format(new Date(b.bookmark_date))}
            </p>

            {b.bookmark_note && (
              <p className="text-sm mt-4">{b.bookmark_note}</p>
            )}

            {b.bookmark_image && (
              <Image
                src={b.bookmark_image}
                alt={b.bookmark_title}
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
      <div className="flex justify-between mt-8">
        <Link
          href={`?page=${page - 1}`}
          className={`px-4 py-2 bg-gray-200 rounded ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
        >
          Previous
        </Link>
        <p className="self-center">Page {page} of {totalPages}</p>
        <Link
          href={`?page=${page + 1}`}
          className={`px-4 py-2 bg-gray-200 rounded ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
        >
          Next
        </Link>
      </div>
    </main>
  );
}