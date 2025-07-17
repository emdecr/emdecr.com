// app/bookmarks/page.tsx
import { loadBookmarks } from "@/lib/bookmarks";
import Link from "next/link";
import Image from "next/image";

const PER_PAGE = 10;

export default async function BookmarksPage({ searchParams }: { searchParams?: { page?: string } }) {
    const page = parseInt(searchParams?.page || "1", 10);
    const allBookmarks = await loadBookmarks();

    // Optional: sort by newest
    allBookmarks.sort(
        (a, b) => new Date(b.bookmark_date).getTime() - new Date(a.bookmark_date).getTime()
    );

    const total = allBookmarks.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    const start = (page - 1) * PER_PAGE;
    const bookmarks = allBookmarks.slice(start, start + PER_PAGE);

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Bookmarks</h1>

            <ul className="space-y-4">
                {bookmarks.map((b, i) => (
                    <li key={`${b.bookmark_link}-${i}`} className="border p-4 rounded">
                        <a href={b.bookmark_link} className="text-blue-600 text-lg font-semibold" target="_blank" rel="noreferrer">
                            {b.bookmark_title}
                        </a>
                        <p className="text-sm text-gray-500">
                            {new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            }).format(new Date(b.bookmark_date))}
                        </p>
                        {b.bookmark_image && (
                            <Image
                                src={b.bookmark_image}
                                alt={b.bookmark_title || "Bookmark image"}
                                width={400}
                                height={200}
                                className="mt-2 object-cover rounded"
                                style={{ maxHeight: "12rem", width: "100%", height: "auto" }}
                                unoptimized // optional if image host isn't compatible with Next's loader
                            />
                        )}
                        {b.bookmark_note && <p className="mt-2">{b.bookmark_note}</p>}
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
                <p className="self-center">
                    Page {page} of {totalPages}
                </p>
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
