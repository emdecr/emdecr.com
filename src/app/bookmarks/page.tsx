import { loadBookmarks } from "@/lib/bookmarks";
import BookmarkList from "./BookmarkList";

export default async function BookmarksPage() {
  const bookmarks = await loadBookmarks();

  // Optional: sort newest first
  bookmarks.sort(
    (a, b) => new Date(b.bookmark_date).getTime() - new Date(a.bookmark_date).getTime()
  );

  return <BookmarkList allBookmarks={bookmarks} />;
}