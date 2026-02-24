import { fetchBooks, fetchCurrentBook } from '@/lib/data-source';

export interface BookCsvRow {
  book_id: string;
  record_id: string;
  post_title: string;
  post_slug: string;
  post_date: string;
  read_title: string;
  read_subtitle: string;
  read_authors: string;
  read_date: string;
  read_year: string;
  read_rating: string;
  read_link: string;
  read_isbn: string;
  read_publisher: string;
  read_image: string;
}

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
  return fetchCurrentBook();
}
