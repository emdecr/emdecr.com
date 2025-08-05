import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const recordsDirectory = path.join(process.cwd(), 'content/records');

// Define the shape of frontmatter inside markdown
export interface RecordMetadata {
  title: string;
  slug: string;
  type: 'book' | 'film' | 'article';
  record_id?: string;
  [key: string]: any; // Optional: Extend as needed (e.g. author, date, etc.)
}

// The full structure returned by getAllRecords / getRecordBySlug
export interface Record {
  slug: string;
  content: string;
  metadata: RecordMetadata;
  filePath: string;
  csvData?: any; // You can use generics if needed
}

/**
 * Recursively reads all markdown files inside the records directory.
 */
function getAllMarkdownFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Get all records (books, films, etc.) as a flat list, using the frontmatter slug
 */
export function getAllRecords(): Record[] {
  const filePaths = getAllMarkdownFiles(recordsDirectory);

  return filePaths.map((filePath) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const metadata = data as RecordMetadata;

    if (!metadata.slug) {
      throw new Error(`Missing 'slug' in frontmatter: ${filePath}`);
    }

    return {
      slug: metadata.slug,
      content,
      metadata,
      filePath,
    };
  });
}

export async function convertMarkdown(rawContent: string) {
  const processedContent = await remark().use(html).process(rawContent);
  const contentHtml = processedContent.toString();

  return {
    contentHtml
  };
}

/**
 * Get a single record by its slug from frontmatter
 */
import { getBookCsvRowByRecordId } from './book-csv';

export function getRecordBySlug(slug: string): Record | undefined {
  const all = getAllRecords();
  const record = all.find((r) => r.slug === slug);
  if (!record) return undefined;

  const { type, record_id } = record.metadata;

  if (type === 'book' && record_id) {
    const csv = getBookCsvRowByRecordId(record_id);
    if (csv) {
      record.csvData = csv;
    }
  }

  // You can add other type-specific data loading here too

  return record;
}
