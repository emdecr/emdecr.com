/**
 * Book server actions — create and update books in Supabase.
 *
 * Similar pattern to bookmark actions, but with two extra concerns:
 *   1. Image upload — if a file is attached, we POST it to /api/upload-image
 *      first, then store the returned CDN URL in read_image.
 *   2. is_current toggle — the books table has a partial unique index that
 *      allows only ONE row to have is_current = true. So when marking a book
 *      as "currently reading", we first set all others to false.
 *
 * Fields that map to blog posts (record_id, post_title, post_slug, post_date)
 * are optional — not every book gets a write-up.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionResult = {
  status: 'success' | 'error' | 'warning';
  message: string;
} | null;

// ─── Helper: parse a string to a number, or null if empty/invalid ────────────
// The live database has book_id, read_year, and read_isbn as bigint columns
// (the CSV import inferred numeric types). We need to send actual numbers,
// not strings, for these fields. Empty strings become null.
function toBigintOrNull(value: string): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

// ─── Helper: upload image via the API route ──────────────────────────────────
// Server actions can't easily process multipart file uploads themselves,
// so we delegate to the /api/upload-image route handler.
// We forward the auth cookies so the route handler can verify the session.

async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const formData = new FormData();
  formData.append('file', file);

  // We need to forward cookies so the upload route can authenticate us.
  // In a server action, we read cookies and pass them as a header.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // Use the app's own URL — in dev this is localhost, in prod it's the site URL.
  // NEXT_PUBLIC_SUPABASE_URL won't work here; we need our own app's origin.
  // We can construct it from the environment or use a relative-ish approach.
  // The simplest reliable way: use the NEXTAUTH_URL or build from headers.
  // For a self-hosted app, we'll use an env var with a sensible default.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/upload-image`, {
    method: 'POST',
    body: formData,
    headers: {
      cookie: cookieHeader,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    return { error: result.error || 'Upload failed' };
  }

  return { url: result.url };
}

// ─── Create Book ─────────────────────────────────────────────────────────────

export async function createBook(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  // --- Parse form fields ---
  const readTitle = (formData.get('read_title') as string)?.trim();
  const readSubtitle = (formData.get('read_subtitle') as string)?.trim() || '';
  const readAuthors = (formData.get('read_authors') as string)?.trim();
  const readDate = (formData.get('read_date') as string)?.trim() || '';
  const readYear = (formData.get('read_year') as string)?.trim() || '';
  const readRating = (formData.get('read_rating') as string)?.trim() || '';
  const readLink = (formData.get('read_link') as string)?.trim() || '';
  const readIsbn = (formData.get('read_isbn') as string)?.trim() || '';
  const readPublisher = (formData.get('read_publisher') as string)?.trim() || '';
  const isCurrent = formData.get('is_current') === 'on';

  // Optional fields that link to a blog post about the book
  const recordId = (formData.get('record_id') as string)?.trim() || '';
  const postTitle = (formData.get('post_title') as string)?.trim() || '';
  const postSlug = (formData.get('post_slug') as string)?.trim() || '';
  const postDate = (formData.get('post_date') as string)?.trim() || '';

  if (!readTitle || !readAuthors) {
    return { status: 'error', message: 'Title and authors are required.' };
  }

  // --- Handle image upload ---
  // The file input sends a File object. If it's empty (no file selected),
  // it's still a File but with size 0.
  // If the upload fails, we still save the book — just without the image.
  // You can always edit the book later and re-upload.
  let readImage = '';
  let imageWarning = '';
  const imageFile = formData.get('read_image_file') as File | null;

  if (imageFile && imageFile.size > 0) {
    const uploadResult = await uploadImage(imageFile);
    if ('error' in uploadResult) {
      imageWarning = ` (image upload failed: ${uploadResult.error})`;
    } else {
      readImage = uploadResult.url;
    }
  }

  // --- Generate the next book_id ---
  // book_id is bigint in the live database, so we work with numbers.
  const { data: maxRow, error: maxError } = await supabase
    .from('books')
    .select('book_id')
    .order('book_id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError) {
    return { status: 'error', message: `Failed to generate ID: ${maxError.message}` };
  }

  const currentMax = maxRow ? Number(maxRow.book_id) : 0;
  const nextId = currentMax + 1;

  // --- Handle is_current toggle ---
  // The partial unique index on books(is_current) WHERE is_current = true
  // means only one book can be "currently reading" at a time.
  // If this new book is current, clear the flag on all existing books first.
  if (isCurrent) {
    const { error: clearError } = await supabase
      .from('books')
      .update({ is_current: false })
      .eq('is_current', true);

    if (clearError) {
      return { status: 'error', message: `Failed to clear current book: ${clearError.message}` };
    }
  }

  // --- Insert the row ---
  // book_id, read_year, and read_isbn are bigint in the live database,
  // so we convert them to numbers (or null) before inserting.
  const { error: insertError } = await supabase
    .from('books')
    .insert({
      book_id: nextId,
      record_id: recordId,
      post_title: postTitle,
      post_slug: postSlug,
      post_date: postDate || null,
      read_title: readTitle,
      read_subtitle: readSubtitle,
      read_authors: readAuthors,
      read_date: readDate,
      read_year: toBigintOrNull(readYear),
      read_rating: readRating,
      read_link: readLink,
      read_isbn: toBigintOrNull(readIsbn),
      read_publisher: readPublisher,
      read_image: readImage,
      is_current: isCurrent,
    });

  if (insertError) {
    return { status: 'error', message: `Insert failed: ${insertError.message}` };
  }

  // --- Bust caches ---
  // The bookshelf page shows all books, and the now page shows the current book.
  revalidatePath('/bookshelf');
  revalidatePath('/now');

  // If the image upload failed, we still saved — let the user know both things
  const status = imageWarning ? 'warning' as const : 'success' as const;
  return { status, message: `Book "${readTitle}" added (ID: ${nextId}).${imageWarning}` };
}


// ─── Update Book ─────────────────────────────────────────────────────────────

export async function updateBook(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  // The book_id comes from a hidden field in the edit form
  const id = formData.get('book_id') as string;
  if (!id) {
    return { status: 'error', message: 'Missing book ID.' };
  }

  const readTitle = (formData.get('read_title') as string)?.trim();
  const readSubtitle = (formData.get('read_subtitle') as string)?.trim() || '';
  const readAuthors = (formData.get('read_authors') as string)?.trim();
  const readDate = (formData.get('read_date') as string)?.trim() || '';
  const readYear = (formData.get('read_year') as string)?.trim() || '';
  const readRating = (formData.get('read_rating') as string)?.trim() || '';
  const readLink = (formData.get('read_link') as string)?.trim() || '';
  const readIsbn = (formData.get('read_isbn') as string)?.trim() || '';
  const readPublisher = (formData.get('read_publisher') as string)?.trim() || '';
  const isCurrent = formData.get('is_current') === 'on';

  const recordId = (formData.get('record_id') as string)?.trim() || '';
  const postTitle = (formData.get('post_title') as string)?.trim() || '';
  const postSlug = (formData.get('post_slug') as string)?.trim() || '';
  const postDate = (formData.get('post_date') as string)?.trim() || '';

  if (!readTitle || !readAuthors) {
    return { status: 'error', message: 'Title and authors are required.' };
  }

  // --- Handle image upload (optional on edit) ---
  // If a new file is uploaded, compress and replace. Otherwise, keep the
  // existing image URL (passed via a hidden field).
  // If the upload fails, we still save — just keep the existing image.
  let readImage = (formData.get('read_image_existing') as string) || '';
  let imageWarning = '';
  const imageFile = formData.get('read_image_file') as File | null;

  if (imageFile && imageFile.size > 0) {
    const uploadResult = await uploadImage(imageFile);
    if ('error' in uploadResult) {
      imageWarning = ` (image upload failed: ${uploadResult.error} — kept existing image)`;
    } else {
      readImage = uploadResult.url;
    }
  }

  // --- Handle is_current toggle ---
  if (isCurrent) {
    // Clear the flag on all OTHER books first (not this one, to avoid
    // a brief state where no book is current).
    const { error: clearError } = await supabase
      .from('books')
      .update({ is_current: false })
      .eq('is_current', true)
      .neq('book_id', id);

    if (clearError) {
      return { status: 'error', message: `Failed to clear current book: ${clearError.message}` };
    }
  }

  // --- Update the row ---
  // Same bigint conversion as createBook for read_year and read_isbn.
  const { error } = await supabase
    .from('books')
    .update({
      record_id: recordId,
      post_title: postTitle,
      post_slug: postSlug,
      post_date: postDate || null,
      read_title: readTitle,
      read_subtitle: readSubtitle,
      read_authors: readAuthors,
      read_date: readDate,
      read_year: toBigintOrNull(readYear),
      read_rating: readRating,
      read_link: readLink,
      read_isbn: toBigintOrNull(readIsbn),
      read_publisher: readPublisher,
      read_image: readImage,
      is_current: isCurrent,
    })
    .eq('book_id', id);

  if (error) {
    return { status: 'error', message: `Update failed: ${error.message}` };
  }

  revalidatePath('/bookshelf');
  revalidatePath('/now');

  const status = imageWarning ? 'warning' as const : 'success' as const;
  return { status, message: `Book "${readTitle}" updated.${imageWarning}` };
}
