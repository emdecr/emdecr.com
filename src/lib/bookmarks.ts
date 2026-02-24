// lib/bookmarks.ts
import { fetchBookmarks as fetchBookmarksFromSource } from '@/lib/data-source';

export type Bookmark = {
  bookmark_id: string;
  bookmark_date: string;
  bookmark_title: string;
  bookmark_link: string;
  bookmark_image: string;
  bookmark_note: string;
};

export async function loadBookmarks(): Promise<Bookmark[]> {
  const bookmarks = await fetchBookmarksFromSource();
  return bookmarks.sort(
    (a, b) => new Date(b.bookmark_date).getTime() - new Date(a.bookmark_date).getTime()
  );
}

export async function getLatestBookmark(): Promise<Bookmark | null> {
  const bookmarks = await loadBookmarks();
  if (bookmarks.length === 0) return null;
  return bookmarks[0];
}
