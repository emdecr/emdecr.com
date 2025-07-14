import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface BookCsvRow {
  book_id: string;
  record_id: string;
  post_title: string;
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

const csvPath = path.join(process.cwd(), 'data/books.csv');

let cachedCsvData: BookCsvRow[] | null = null;

function loadCsv(): BookCsvRow[] {
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as BookCsvRow[];
}

export function getCsvData(): BookCsvRow[] {
  if (!cachedCsvData) {
    cachedCsvData = loadCsv();
  }
  return cachedCsvData;
}

// Example lookup by record_id (assuming frontmatter has record_id: "xyz")
export function getBookCsvRowByRecordId(id: string): BookCsvRow | undefined {
    // Normalize both values as strings
    return getCsvData().find((row) => String(row.record_id) === String(id));
}

// Example lookup by book_id (assuming frontmatter has book_id: "xyz")
export function getBookCsvRowByBookId(id: string): BookCsvRow | undefined {
    // Normalize both values as strings
    return getCsvData().find((row) => String(row.book_id) === String(id));
}
