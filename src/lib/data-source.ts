import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { unstable_cache } from 'next/cache';

export type Bookmark = {
  bookmark_id: string;
  bookmark_date: string;
  bookmark_title: string;
  bookmark_link: string;
  bookmark_image: string;
  bookmark_note: string;
};

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

const REVALIDATE_SECONDS = 300;

function useSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

function getSupabase(): SupabaseClient | null {
  if (!useSupabase()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function rowToBookmark(row: Record<string, unknown>): Bookmark {
  return {
    bookmark_id: String(row.bookmark_id ?? ''),
    bookmark_date: String(row.bookmark_date ?? ''),
    bookmark_title: String(row.bookmark_title ?? ''),
    bookmark_link: String(row.bookmark_link ?? ''),
    bookmark_image: String(row.bookmark_image ?? ''),
    bookmark_note: String(row.bookmark_note ?? ''),
  };
}

function rowToBookCsvRow(row: Record<string, unknown>): BookCsvRow {
  return {
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
  };
}

async function fetchBookmarksFromSupabase(): Promise<Bookmark[]> {
  const supabase = getSupabase();
  if (!supabase) return fetchBookmarksFromCsv();

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('bookmark_date', { ascending: false });

  if (error) {
    console.error('[data-source] Supabase bookmarks error:', error.message);
    return fetchBookmarksFromCsv();
  }

  return (data ?? []).map(rowToBookmark);
}

async function fetchBookmarksFromCsv(): Promise<Bookmark[]> {
  const filePath = path.join(process.cwd(), 'data/bookmarks.csv');
  const file = await fs.readFile(filePath, 'utf8');
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Bookmark[];
  return records;
}

async function fetchBooksFromSupabase(): Promise<BookCsvRow[]> {
  const supabase = getSupabase();
  if (!supabase) return fetchBooksFromCsv();

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('book_id', { ascending: false });

  if (error) {
    console.error('[data-source] Supabase books error:', error.message);
    return fetchBooksFromCsv();
  }

  return (data ?? []).map(rowToBookCsvRow);
}

async function fetchBooksFromCsv(): Promise<BookCsvRow[]> {
  const filePath = path.join(process.cwd(), 'data/books.csv');
  const file = await fs.readFile(filePath, 'utf8');
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as BookCsvRow[];
  return records;
}

async function fetchCurrentBookFromSupabase(): Promise<BookCsvRow | null> {
  const supabase = getSupabase();
  if (!supabase) return fetchCurrentBookFromCsv();

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_current', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[data-source] Supabase current book error:', error.message);
    return fetchCurrentBookFromCsv();
  }

  if (!data) return null;
  return rowToBookCsvRow(data);
}

async function fetchCurrentBookFromCsv(): Promise<BookCsvRow | null> {
  const { currentBookId } = await import('./config');
  const books = await fetchBooks();
  const row = books.find((b) => String(b.book_id) === String(currentBookId));
  return row ?? null;
}

export const fetchBookmarks = unstable_cache(
  async (): Promise<Bookmark[]> => {
    return useSupabase() ? fetchBookmarksFromSupabase() : fetchBookmarksFromCsv();
  },
  ['data-source-bookmarks'],
  { revalidate: REVALIDATE_SECONDS }
);

export const fetchBooks = unstable_cache(
  async (): Promise<BookCsvRow[]> => {
    return useSupabase() ? fetchBooksFromSupabase() : fetchBooksFromCsv();
  },
  ['data-source-books'],
  { revalidate: REVALIDATE_SECONDS }
);

export const getCachedCurrentBook = unstable_cache(
  async (): Promise<BookCsvRow | null> => {
    return useSupabase() ? fetchCurrentBookFromSupabase() : fetchCurrentBookFromCsv();
  },
  ['data-source-current-book'],
  { revalidate: REVALIDATE_SECONDS }
);

export async function fetchCurrentBook(): Promise<BookCsvRow | null> {
  return getCachedCurrentBook();
}
