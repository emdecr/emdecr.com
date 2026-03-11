import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getBookCsvRowByRecordId } from './book-csv';
import { remark } from 'remark';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

const recordsDirectory = path.join(process.cwd(), 'content/records');

// Define the shape of frontmatter inside markdown
export interface RecordMetadata {
  title: string;
  slug: string;
  date: string;
  type: 'book' | 'film' | 'article';
  summary?: string;
  record_id?: string;
  categories?: string[];
  status?: 'published' | 'draft' | 'hidden'; // Controls visibility on front-end
  [key: string]: unknown;
}

// The full structure returned by getAllRecords / getRecordBySlug
export interface Record {
  slug: string;
  content: string;
  metadata: RecordMetadata;
  filePath: string;
  csvData?: unknown;
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
 * Only returns records with status 'published' or no status (for backward compatibility)
 */
export function getAllRecords(): Record[] {
  const filePaths = getAllMarkdownFiles(recordsDirectory);

  return filePaths
    .map((filePath) => {
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
    })
    .filter((record) => {
      // Only show published records (or records with no status for backward compatibility)
      const status = record.metadata.status;
      return !status || status === 'published';
    })
    .sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
}

export async function convertMarkdown(rawContent: string): Promise<{ contentHtml: string }> {
  const processedContent = await remark()
    .use(remarkParse) // Parse markdown into mdast
    .use(remarkGfm) // GitHub-flavored markdown (tables, strikethrough, task lists, footnotes, etc.)
    .use(remarkRehype, { allowDangerousHtml: true }) // Convert mdast -> hast (HTML AST)
    .use(rehypeRaw) // Parse any raw HTML in the markdown
    // .use(rehypeSanitize) // Optional: sanitize HTML for safety
    // .use(rehypeHighlight) // Optional: syntax highlighting
    .use(rehypeStringify) // Turn hast back into HTML string
    .process(rawContent);

  return {
    contentHtml: processedContent.toString()
  };
}

/**
 * Get a single record by its record_id from frontmatter (for linking CSV rows to full posts).
 */
export function getRecordByRecordId(record_id: string): Record | undefined {
  const all = getAllRecords();
  return all.find((r) => r.metadata.record_id != null && String(r.metadata.record_id) === String(record_id));
}

/**
 * Get a single record by its slug from frontmatter
 */
export async function getRecordBySlug(slug: string): Promise<Record | undefined> {
  const all = getAllRecords();
  const record = all.find((r) => r.slug === slug);
  if (!record) return undefined;

  const { type, record_id } = record.metadata;

  if (type === 'book' && record_id) {
    const csv = await getBookCsvRowByRecordId(record_id);
    if (csv) {
      record.csvData = csv;
    }
  }

  // You can add other type-specific data loading here too

  return record;
}

/**
 * Get all unique categories across markdown and bespoke records.
 */
export function getAllCategories(): string[] {
  const { getAllBespokeRecords } = require('./bespoke-records');
  const markdownRecords = getAllRecords();
  const bespokeRecords = getAllBespokeRecords();

  const categories = new Set<string>();

  for (const r of markdownRecords) {
    for (const cat of r.metadata.categories ?? []) {
      categories.add(cat);
    }
  }
  for (const r of bespokeRecords) {
    for (const cat of r.categories ?? []) {
      categories.add(cat);
    }
  }

  return Array.from(categories).sort();
}

/**
 * Get all records (markdown + bespoke) that belong to a given category.
 */
export function getRecordsByCategory(category: string) {
  const { getAllBespokeRecords } = require('./bespoke-records');
  const markdownRecords = getAllRecords();
  const bespokeRecords = getAllBespokeRecords();

  const allRecords = [
    ...markdownRecords.map((r) => ({
      slug: r.slug,
      title: r.metadata.title,
      date: r.metadata.date,
      summary: r.metadata.summary,
      categories: r.metadata.categories ?? [],
    })),
    ...bespokeRecords.map((r: { slug: string; title: string; date: string; summary?: string; categories?: string[] }) => ({
      slug: r.slug,
      title: r.title,
      date: r.date,
      summary: r.summary,
      categories: r.categories ?? [],
    })),
  ];

  return allRecords
    .filter((r) => r.categories.includes(category))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Read a standalone markdown page from content/pages/ and convert to HTML.
 */
export async function getMarkdownContent(fileName: string) {
  const filePath = path.join(process.cwd(), 'content/pages', fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(fileContents);
  const { contentHtml } = await convertMarkdown(content);
  return { contentHtml, data };
}
