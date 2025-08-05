// lib/bookmarks.ts
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

export type Bookmark = {
  bookmark_id: string;
  bookmark_date: string;
  bookmark_title: string;
  bookmark_link: string;
  bookmark_image: string;
  bookmark_note: string;
};

const filePath = path.join(process.cwd(), 'data/bookmarks.csv');

export async function loadBookmarks(): Promise<Bookmark[]> {
  const file = await fs.readFile(filePath, "utf8");

  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records as Bookmark[];
}

// Get the latest bookmark by date
export async function getLatestBookmark(): Promise<Bookmark | null> {
  const bookmarks = await loadBookmarks();

  if (bookmarks.length === 0) return null;

  const sorted = bookmarks.sort(
    (a, b) => new Date(b.bookmark_date).getTime() - new Date(a.bookmark_date).getTime()
  );

  return sorted[0];
}