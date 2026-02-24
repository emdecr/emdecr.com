/**
 * One-off script to import data/bookmarks.csv and data/books.csv into Supabase.
 *
 * Prerequisites:
 * 1. Run the migration: supabase/migrations/001_bookmarks_and_books.sql
 * 2. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY (e.g. in .env.local)
 *
 * Run (from project root):
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-csv-to-supabase.ts
 *
 * Or with env from .env.local (requires dotenv: npm i -D dotenv):
 *   node -r dotenv/config node_modules/.bin/ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-csv-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const CURRENT_BOOK_ID = '69'; // Same as config.currentBookId; set is_current for this book

function loadCsv(filename: string): Record<string, string>[] {
  const filePath = path.join(process.cwd(), 'data', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY (e.g. from .env.local)');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Import bookmarks
  const bookmarks = loadCsv('bookmarks.csv');
  if (bookmarks.length > 0) {
    const { error } = await supabase.from('bookmarks').upsert(bookmarks, {
      onConflict: 'bookmark_id',
    });
    if (error) {
      console.error('Bookmarks insert error:', error.message);
      process.exit(1);
    }
    console.log(`Imported ${bookmarks.length} bookmarks`);
  }

  // Import books (with is_current for current book)
  const booksRaw = loadCsv('books.csv');
  const books = booksRaw.map((row) => ({
    ...row,
    is_current: row.book_id === CURRENT_BOOK_ID,
  }));
  if (books.length > 0) {
    const { error } = await supabase.from('books').upsert(books, {
      onConflict: 'book_id',
    });
    if (error) {
      console.error('Books insert error:', error.message);
      process.exit(1);
    }
    console.log(`Imported ${books.length} books (is_current = true for book_id ${CURRENT_BOOK_ID})`);
  }

  console.log('Done.');
}

main();
