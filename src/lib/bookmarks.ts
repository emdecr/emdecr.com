// lib/bookmarks.ts
import { fetchBookmarks as fetchBookmarksFromSource, type Bookmark } from '@/lib/data-source';

export type { Bookmark };

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
