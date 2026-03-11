import type { Metadata } from 'next'
import { connection } from 'next/server'
import { loadBookmarks } from "@/lib/bookmarks";
import BookmarkList from "./BookmarkList";

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Bookmarks',
  description: 'A collection of bookmarked links and resources.',
}

export default async function BookmarksPage() {
  await connection()
  const bookmarks = await loadBookmarks();

  return <BookmarkList allBookmarks={bookmarks} />;
}