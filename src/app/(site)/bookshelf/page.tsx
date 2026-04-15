import type { Metadata } from 'next';
import Link from 'next/link';
import { getCsvData } from '@/lib/book-csv';
import { getRecordByRecordId } from '@/lib/records';

export const metadata: Metadata = {
  title: 'Bookshelf',
  description: 'Reading list and book notes.',
};

/**
 * The bookshelf grid — shows every book with its cover, title, and author.
 *
 * Not every book links to its own page. A book only gets a dedicated page
 * when it has notes — determined by the record_id field on the book row.
 * If record_id is set and a matching markdown record exists in
 * content/records/, the book card becomes a clickable link to that record
 * and shows a small "Notes" badge. Otherwise it renders as a static card.
 *
 * This keeps the bookshelf from generating dozens of near-empty detail
 * pages for books that only have metadata (cover, author, rating, etc.).
 */
export default async function BookshelfPage() {
  const books = await getCsvData();

  return (
    <main className="prose">
      <h1 className="text-2xl font-semibold mb-6">Bookshelf</h1>
      <p className="text-sm text-gray-500 mb-6">
        Trying to keep track of what I&apos;ve read, and some of my notes on them.
      </p>
      <ul className="not-prose list-none p-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {books.map((row) => {
          // Check if this book has linked notes.
          // record_id is an empty string "" when not set (from CSV parsing),
          // which is falsy — so a simple truthy check works here.
          const record = row.record_id ? getRecordByRecordId(row.record_id) : undefined;
          const hasNotes = Boolean(record);
          const title = row.read_title || row.post_title;

          // Determine the link target:
          //   1. If the book has notes (a linked markdown record), link to the notes page.
          //   2. Otherwise, if the book has a read_link (e.g. an external URL like
          //      Goodreads or a publisher site), use that as a fallback.
          //   3. If neither exists, the card is static / non-clickable.
          const linkHref = hasNotes
            ? `/records/${record!.slug}`
            : row.read_link || undefined;

          // Card interior — shared between linked and static versions
          // to avoid duplicating the JSX for both cases.
          const cardContent = (
            <>
              <div className="aspect-[2/3] rounded border border-gray-200 overflow-hidden bg-gray-100 mb-2">
                {row.read_image ? (
                  <img
                    src={row.read_image}
                    alt=""
                    width={160}
                    height={240}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm" aria-hidden>
                    No cover
                  </div>
                )}
              </div>
              <p className="font-medium text-sm leading-tight group-hover:underline">
                {title}
              </p>
              {row.read_authors ? (
                <p className="text-xs text-gray-600 mt-0.5 truncate" title={row.read_authors}>
                  {row.read_authors}
                </p>
              ) : null}
              {/* Small badge indicating this book has a notes page.
                  Only shown when a linked markdown record exists. */}
              {hasNotes && (
                <span className="inline-block text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mt-1">
                  Notes
                </span>
              )}
            </>
          );

          return (
            <li key={row.book_id}>
              {linkHref ? (
                // Linked card — either internal notes page or external read_link.
                // For external links (read_link), open in a new tab.
                hasNotes ? (
                  <Link
                    href={linkHref}
                    prefetch={false}
                    className="block no-underline group"
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <a
                    href={linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block no-underline group"
                  >
                    {cardContent}
                  </a>
                )
              ) : (
                // No notes and no external link — static, non-clickable card
                <div className="block">
                  {cardContent}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
