import { connection } from 'next/server'
import { loadBookmarks } from "@/lib/bookmarks";
import BookmarkList from "./BookmarkList";

export default async function BookmarksPage() {
  await connection()
  const bookmarks = await loadBookmarks();

  return <BookmarkList allBookmarks={bookmarks} />;
}