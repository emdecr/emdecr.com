import { fetchBooks, getCachedCurrentBook, type BookCsvRow } from '@/lib/data-source';

export type { BookCsvRow };

export async function getCsvData(): Promise<BookCsvRow[]> {
  return fetchBooks();
}

export async function getBookCsvRowByRecordId(id: string): Promise<BookCsvRow | undefined> {
  const books = await getCsvData();
  return books.find((row) => String(row.record_id) === String(id));
}

export async function getBookCsvRowByBookId(id: string): Promise<BookCsvRow | undefined> {
  const books = await getCsvData();
  return books.find((row) => String(row.book_id) === String(id));
}

export async function getBookBySlug(slug: string): Promise<BookCsvRow | undefined> {
  const books = await getCsvData();
  return books.find((row) => row.post_slug === slug);
}

/** Current book (is_current in Supabase, or config.currentBookId when using CSV fallback). */
export async function getCurrentBook(): Promise<BookCsvRow | null> {
  return getCachedCurrentBook();
}
