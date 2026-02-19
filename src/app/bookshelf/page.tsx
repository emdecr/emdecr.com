import type { Metadata } from 'next';
import Link from 'next/link';
import { getCsvData } from '@/lib/book-csv';
import { getRecordByRecordId } from '@/lib/records';

export const metadata: Metadata = {
  title: 'Bookshelf',
  description: 'Reading list and book notes.',
};

export default async function BookshelfPage() {
  const books = getCsvData();

  return (
    <main className="prose">
      <h1 className="text-2xl font-semibold mb-6">Bookshelf</h1>
      <p className="text-sm text-gray-500 mb-6">
        Trying to keep track of what I&apos;ve read, and some of my notes on them.
      </p>
      <ul className="not-prose list-none p-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {books.map((row) => {
          const record = row.record_id ? getRecordByRecordId(row.record_id) : undefined;
          const slug = record ? record.slug : row.post_slug;
          const title = row.read_title || row.post_title;
          return (
            <li key={row.book_id}>
              <Link href={`/records/${slug}`} className="block no-underline group">
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
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
