// lib/bookmarks.ts
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

export type Bookmark = {
  bookmark_date: string;
  bookmark_title: string;
  bookmark_link: string;
  bookmark_image: string;
  bookmark_note: string;
};

export async function loadBookmarks(): Promise<Bookmark[]> {
  const filePath = path.join(process.cwd(), "data/bookmarks.csv");
  const file = await fs.readFile(filePath, "utf8");

  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records as Bookmark[];
}
