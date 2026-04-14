/**
 * /ctrl/books — Admin page for managing books.
 *
 * Same pattern as /ctrl/bookmarks:
 *   - Server component fetches the 5 most recent books
 *   - Renders a create form at the top, edit forms below
 *   - force-dynamic so we always get fresh data in the admin
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BookCreateForm, BookEditForm } from './BookForms';
import type { BookForEdit } from './BookForms';

export const dynamic = 'force-dynamic';

export default async function BooksAdminPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch the 5 most recent books, including is_current
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('book_id', { ascending: false })
    .limit(5);

  // Map the raw rows to the shape our form components expect.
  // The BookCsvRow type doesn't include is_current, so we build a
  // slightly extended type (BookForEdit) that does.
  const recentBooks: BookForEdit[] = (data ?? []).map((row) => ({
    book_id: String(row.book_id ?? ''),
    record_id: String(row.record_id ?? ''),
    post_title: String(row.post_title ?? ''),
    post_slug: String(row.post_slug ?? ''),
    post_date: String(row.post_date ?? ''),
    read_title: String(row.read_title ?? ''),
    read_subtitle: String(row.read_subtitle ?? ''),
    read_authors: String(row.read_authors ?? ''),
    read_date: String(row.read_date ?? ''),
    read_year: String(row.read_year ?? ''),
    read_rating: String(row.read_rating ?? ''),
    read_link: String(row.read_link ?? ''),
    read_isbn: String(row.read_isbn ?? ''),
    read_publisher: String(row.read_publisher ?? ''),
    read_image: String(row.read_image ?? ''),
    is_current: Boolean(row.is_current),
  }));

  return (
    <div>
      <h1 className="text-lg font-bold mb-6">Books</h1>

      {/* ── Create new book ── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Add New
        </h2>
        <BookCreateForm />
      </section>

      {/* ── Edit recent books ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Recent ({recentBooks.length})
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-4">
            Failed to load books: {error.message}
          </p>
        )}

        {recentBooks.length === 0 && !error && (
          <p className="text-sm text-gray-500">No books yet.</p>
        )}

        <div className="space-y-6">
          {recentBooks.map((book) => (
            <BookEditForm key={book.book_id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
