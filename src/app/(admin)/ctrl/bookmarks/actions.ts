/**
 * Bookmark server actions — create and update bookmarks in Supabase.
 *
 * These run on the server (marked with "use server") and are called from
 * the bookmark admin form via useActionState. They:
 *   1. Parse form data
 *   2. Create an authenticated Supabase client (reads JWT from cookies)
 *   3. Insert or update the row
 *   4. Bust the Next.js cache so the public /bookmarks page updates immediately
 *   5. Return a result object so the form can show success/error feedback
 */
'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── Types ───────────────────────────────────────────────────────────────────

// The shape returned to the form via useActionState.
// `status` is null before the first submission, then 'success' or 'error'.
export type ActionResult = {
  status: 'success' | 'error';
  message: string;
} | null;

// ─── Create Bookmark ─────────────────────────────────────────────────────────

export async function createBookmark(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  // --- Parse form fields ---
  const title = (formData.get('bookmark_title') as string)?.trim();
  const link = (formData.get('bookmark_link') as string)?.trim();
  const image = (formData.get('bookmark_image') as string)?.trim() || '';
  const note = (formData.get('bookmark_note') as string)?.trim() || '';
  const dateStr = formData.get('bookmark_date') as string;

  if (!title || !link) {
    return { status: 'error', message: 'Title and link are required.' };
  }

  // --- Generate the next bookmark_id ---
  // Current IDs are numeric strings ("147", "146", ...).
  // Query the highest one, parse as int, add 1, stringify.
  const { data: maxRow, error: maxError } = await supabase
    .from('bookmarks')
    .select('bookmark_id')
    .order('bookmark_id', { ascending: false }) // text sort, but works for same-length numeric strings
    .limit(1)
    .maybeSingle();

  if (maxError) {
    return { status: 'error', message: `Failed to generate ID: ${maxError.message}` };
  }

  // Parse the current max ID and increment. Fall back to 1 if table is empty.
  const currentMax = maxRow ? parseInt(maxRow.bookmark_id, 10) : 0;
  const nextId = String(currentMax + 1);

  // --- Format the date ---
  // The form sends a datetime-local string like "2026-04-13T14:30".
  // Supabase expects a timestamptz, so we append a timezone offset.
  // If no date was provided, default to right now.
  const bookmarkDate = dateStr
    ? new Date(dateStr).toISOString()
    : new Date().toISOString();

  // --- Insert the row ---
  const { error: insertError } = await supabase
    .from('bookmarks')
    .insert({
      bookmark_id: nextId,
      bookmark_date: bookmarkDate,
      bookmark_title: title,
      bookmark_link: link,
      bookmark_image: image,
      bookmark_note: note,
    });

  if (insertError) {
    return { status: 'error', message: `Insert failed: ${insertError.message}` };
  }

  // --- Bust the cache ---
  // The public /bookmarks page uses unstable_cache with a 300s TTL.
  // revalidatePath forces it to re-fetch on the next request.
  revalidatePath('/bookmarks');

  return { status: 'success', message: `Bookmark "${title}" added (ID: ${nextId}).` };
}

// ─── Update Bookmark ─────────────────────────────────────────────────────────

export async function updateBookmark(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  // The bookmark_id is passed as a hidden field in the edit form
  const id = formData.get('bookmark_id') as string;
  if (!id) {
    return { status: 'error', message: 'Missing bookmark ID.' };
  }

  const title = (formData.get('bookmark_title') as string)?.trim();
  const link = (formData.get('bookmark_link') as string)?.trim();
  const image = (formData.get('bookmark_image') as string)?.trim() || '';
  const note = (formData.get('bookmark_note') as string)?.trim() || '';
  const dateStr = formData.get('bookmark_date') as string;

  if (!title || !link) {
    return { status: 'error', message: 'Title and link are required.' };
  }

  const bookmarkDate = dateStr
    ? new Date(dateStr).toISOString()
    : undefined; // don't overwrite if not provided

  // Build the update payload — only include date if it was provided
  const updates: Record<string, string> = {
    bookmark_title: title,
    bookmark_link: link,
    bookmark_image: image,
    bookmark_note: note,
  };
  if (bookmarkDate) {
    updates.bookmark_date = bookmarkDate;
  }

  const { error } = await supabase
    .from('bookmarks')
    .update(updates)
    .eq('bookmark_id', id);

  if (error) {
    return { status: 'error', message: `Update failed: ${error.message}` };
  }

  revalidatePath('/bookmarks');

  return { status: 'success', message: `Bookmark "${title}" updated.` };
}
