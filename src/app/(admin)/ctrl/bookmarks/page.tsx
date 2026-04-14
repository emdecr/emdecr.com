/**
 * /ctrl/bookmarks — Admin page for managing bookmarks.
 *
 * This is a server component that fetches the 5 most recent bookmarks,
 * then renders two client-side form components:
 *   1. A "create new" form at the top
 *   2. A list of the 5 most recent bookmarks as editable forms
 *
 * Why server + client split?
 * - We need to fetch data on the server (Supabase query with auth cookie)
 * - We need useActionState on the client (for form submission + feedback)
 * - Server component does the fetch, passes data to client components as props
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BookmarkCreateForm, BookmarkEditForm } from './BookmarkForms';
import type { Bookmark } from '@/lib/data-source';

export const dynamic = 'force-dynamic'; // always fetch fresh data for admin

export default async function BookmarksAdminPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch the 5 most recent bookmarks for the edit list
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('bookmark_date', { ascending: false })
    .limit(5);

  const recentBookmarks: Bookmark[] = (data ?? []).map((row) => ({
    bookmark_id: String(row.bookmark_id ?? ''),
    bookmark_date: String(row.bookmark_date ?? ''),
    bookmark_title: String(row.bookmark_title ?? ''),
    bookmark_link: String(row.bookmark_link ?? ''),
    bookmark_image: String(row.bookmark_image ?? ''),
    bookmark_note: String(row.bookmark_note ?? ''),
  }));

  return (
    <div>
      <h1 className="text-lg font-bold mb-6">Bookmarks</h1>

      {/* ── Create new bookmark ── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Add New
        </h2>
        <BookmarkCreateForm />
      </section>

      {/* ── Edit recent bookmarks ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Recent ({recentBookmarks.length})
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-4">
            Failed to load bookmarks: {error.message}
          </p>
        )}

        {recentBookmarks.length === 0 && !error && (
          <p className="text-sm text-gray-500">No bookmarks yet.</p>
        )}

        <div className="space-y-6">
          {recentBookmarks.map((bookmark) => (
            <BookmarkEditForm key={bookmark.bookmark_id} bookmark={bookmark} />
          ))}
        </div>
      </section>
    </div>
  );
}
