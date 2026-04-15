import { fetchBooks, getCachedCurrentBook, type BookCsvRow } from '@/lib/data-source';

export type { BookCsvRow };

/**
 * Returns all books from Supabase (or CSV fallback).
 * Used by the bookshelf page to render the full grid of books.
 */
export async function getCsvData(): Promise<BookCsvRow[]> {
  return fetchBooks();
}

/**
 * Find a book by its record_id — the field that links a book row to a
 * markdown record in content/records/. Used by the records system
 * (src/lib/records.ts) to enrich book-type markdown pages with CSV
 * metadata like cover image, author, rating, etc.
 */
export async function getBookCsvRowByRecordId(id: string): Promise<BookCsvRow | undefined> {
  const books = await getCsvData();
  return books.find((row) => String(row.record_id) === String(id));
}

/**
 * Find a book by its book_id (the primary key).
 * Used by the admin panel (ctrl/books) for editing individual books.
 */
export async function getBookCsvRowByBookId(id: string): Promise<BookCsvRow | undefined> {
  const books = await getCsvData();
  return books.find((row) => String(row.book_id) === String(id));
}

/**
 * Returns the single "currently reading" book.
 * Backed by the is_current boolean in Supabase (with a unique partial
 * index enforcing at most one), or config.currentBookId for CSV fallback.
 */
export async function getCurrentBook(): Promise<BookCsvRow | null> {
  return getCachedCurrentBook();
}
