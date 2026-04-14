/**
 * Client-side book forms — create and edit.
 *
 * More fields than bookmarks, plus:
 *   - File input for cover image upload (compressed server-side to WebP)
 *   - is_current checkbox for "currently reading" on the Now page
 *   - Optional "post" fields that link a book to a blog write-up
 *
 * The forms are intentionally verbose (not abstracted into a shared component)
 * so each one is easy to read and modify independently.
 */
'use client';

import { useActionState } from 'react';
import { createBook, updateBook } from './actions';
import type { ActionResult } from './actions';

// ─── Types ───────────────────────────────────────────────────────────────────
// Matches the shape we get from the server component (BookCsvRow + is_current)

export type BookForEdit = {
  book_id: string;
  record_id: string;
  post_title: string;
  post_slug: string;
  post_date: string;
  read_title: string;
  read_subtitle: string;
  read_authors: string;
  read_date: string;
  read_year: string;
  read_rating: string;
  read_link: string;
  read_isbn: string;
  read_publisher: string;
  read_image: string;
  is_current: boolean;
};

// ─── Shared styles ───────────────────────────────────────────────────────────

const labelClass = 'block text-sm mb-1';
const inputClass =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black';
const buttonClass =
  'bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';

function StatusMessage({ result }: { result: ActionResult }) {
  if (!result) return null;
  const colorMap = {
    success: 'text-green-700',
    warning: 'text-amber-600',  // book saved, but image upload failed
    error: 'text-red-600',
  };
  return <p className={`text-sm ${colorMap[result.status]} mt-2`}>{result.message}</p>;
}

// ─── Create Form ─────────────────────────────────────────────────────────────

export function BookCreateForm() {
  const [result, formAction, isPending] = useActionState(createBook, null);

  return (
    <form action={formAction} className="space-y-3 border border-gray-200 rounded p-4">
      {/* ── Core book info ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="create-read-title" className={labelClass}>Title *</label>
          <input id="create-read-title" name="read_title" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="create-read-subtitle" className={labelClass}>Subtitle</label>
          <input id="create-read-subtitle" name="read_subtitle" type="text" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="create-read-authors" className={labelClass}>Authors *</label>
        <input id="create-read-authors" name="read_authors" type="text" required className={inputClass} />
        <p className="text-xs text-gray-400 mt-1">Separate multiple authors with semicolons</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="create-read-date" className={labelClass}>Date Read</label>
          <input id="create-read-date" name="read_date" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="create-read-year" className={labelClass}>Year Published</label>
          <input id="create-read-year" name="read_year" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="create-read-rating" className={labelClass}>Rating</label>
          <input id="create-read-rating" name="read_rating" type="text" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="create-read-isbn" className={labelClass}>ISBN</label>
          <input id="create-read-isbn" name="read_isbn" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="create-read-publisher" className={labelClass}>Publisher</label>
          <input id="create-read-publisher" name="read_publisher" type="text" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="create-read-link" className={labelClass}>Link</label>
        <input id="create-read-link" name="read_link" type="url" className={inputClass} />
      </div>

      {/* ── Cover image ── */}
      <div>
        <label htmlFor="create-read-image" className={labelClass}>Cover Image</label>
        <input
          id="create-read-image"
          name="read_image_file"
          type="file"
          accept="image/*"
          className="text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Will be compressed to WebP</p>
      </div>

      {/* ── Currently reading toggle ── */}
      <div className="flex items-center gap-2">
        <input id="create-is-current" name="is_current" type="checkbox" className="rounded" />
        <label htmlFor="create-is-current" className="text-sm">
          Currently reading
        </label>
      </div>

      {/* ── Optional: link to a blog post ── */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Link to blog post (optional)
        </summary>
        <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-100">
          <div>
            <label htmlFor="create-record-id" className={labelClass}>Record ID</label>
            <input id="create-record-id" name="record_id" type="text" className={inputClass} />
          </div>
          <div>
            <label htmlFor="create-post-title" className={labelClass}>Post Title</label>
            <input id="create-post-title" name="post_title" type="text" className={inputClass} />
          </div>
          <div>
            <label htmlFor="create-post-slug" className={labelClass}>Post Slug</label>
            <input id="create-post-slug" name="post_slug" type="text" className={inputClass} />
          </div>
          <div>
            <label htmlFor="create-post-date" className={labelClass}>Post Date</label>
            <input id="create-post-date" name="post_date" type="datetime-local" className={inputClass} />
          </div>
        </div>
      </details>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending} className={buttonClass}>
          {isPending ? 'Adding...' : 'Add Book'}
        </button>
        <StatusMessage result={result} />
      </div>
    </form>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────
// Pre-filled with the book's current values. Each recent book gets its own
// independent form instance.

export function BookEditForm({ book }: { book: BookForEdit }) {
  const [result, formAction, isPending] = useActionState(updateBook, null);

  return (
    <form action={formAction} className="space-y-3 border border-gray-200 rounded p-4">
      {/* Hidden fields for the server action */}
      <input type="hidden" name="book_id" value={book.book_id} />
      {/* Preserve existing image URL in case no new file is uploaded */}
      <input type="hidden" name="read_image_existing" value={book.read_image} />

      {/* ID + current image preview */}
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-400">ID: {book.book_id}</p>
        {book.read_image && (
          <img
            src={book.read_image}
            alt=""
            className="w-12 h-16 object-cover rounded border border-gray-200"
          />
        )}
      </div>

      {/* ── Core book info ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`edit-read-title-${book.book_id}`} className={labelClass}>Title *</label>
          <input
            id={`edit-read-title-${book.book_id}`}
            name="read_title"
            type="text"
            required
            defaultValue={book.read_title}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`edit-read-subtitle-${book.book_id}`} className={labelClass}>Subtitle</label>
          <input
            id={`edit-read-subtitle-${book.book_id}`}
            name="read_subtitle"
            type="text"
            defaultValue={book.read_subtitle}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`edit-read-authors-${book.book_id}`} className={labelClass}>Authors *</label>
        <input
          id={`edit-read-authors-${book.book_id}`}
          name="read_authors"
          type="text"
          required
          defaultValue={book.read_authors}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor={`edit-read-date-${book.book_id}`} className={labelClass}>Date Read</label>
          <input
            id={`edit-read-date-${book.book_id}`}
            name="read_date"
            type="date"
            defaultValue={book.read_date}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`edit-read-year-${book.book_id}`} className={labelClass}>Year Published</label>
          <input
            id={`edit-read-year-${book.book_id}`}
            name="read_year"
            type="text"
            defaultValue={book.read_year}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`edit-read-rating-${book.book_id}`} className={labelClass}>Rating</label>
          <input
            id={`edit-read-rating-${book.book_id}`}
            name="read_rating"
            type="text"
            defaultValue={book.read_rating}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`edit-read-isbn-${book.book_id}`} className={labelClass}>ISBN</label>
          <input
            id={`edit-read-isbn-${book.book_id}`}
            name="read_isbn"
            type="text"
            defaultValue={book.read_isbn}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`edit-read-publisher-${book.book_id}`} className={labelClass}>Publisher</label>
          <input
            id={`edit-read-publisher-${book.book_id}`}
            name="read_publisher"
            type="text"
            defaultValue={book.read_publisher}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`edit-read-link-${book.book_id}`} className={labelClass}>Link</label>
        <input
          id={`edit-read-link-${book.book_id}`}
          name="read_link"
          type="url"
          defaultValue={book.read_link}
          className={inputClass}
        />
      </div>

      {/* ── Cover image replacement ── */}
      <div>
        <label htmlFor={`edit-read-image-${book.book_id}`} className={labelClass}>
          Replace Cover Image
        </label>
        <input
          id={`edit-read-image-${book.book_id}`}
          name="read_image_file"
          type="file"
          accept="image/*"
          className="text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Leave empty to keep current image
        </p>
      </div>

      {/* ── Currently reading toggle ── */}
      <div className="flex items-center gap-2">
        <input
          id={`edit-is-current-${book.book_id}`}
          name="is_current"
          type="checkbox"
          defaultChecked={book.is_current}
          className="rounded"
        />
        <label htmlFor={`edit-is-current-${book.book_id}`} className="text-sm">
          Currently reading
        </label>
      </div>

      {/* ── Optional: link to a blog post ── */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Link to blog post (optional)
        </summary>
        <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-100">
          <div>
            <label htmlFor={`edit-record-id-${book.book_id}`} className={labelClass}>Record ID</label>
            <input
              id={`edit-record-id-${book.book_id}`}
              name="record_id"
              type="text"
              defaultValue={book.record_id}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`edit-post-title-${book.book_id}`} className={labelClass}>Post Title</label>
            <input
              id={`edit-post-title-${book.book_id}`}
              name="post_title"
              type="text"
              defaultValue={book.post_title}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`edit-post-slug-${book.book_id}`} className={labelClass}>Post Slug</label>
            <input
              id={`edit-post-slug-${book.book_id}`}
              name="post_slug"
              type="text"
              defaultValue={book.post_slug}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`edit-post-date-${book.book_id}`} className={labelClass}>Post Date</label>
            <input
              id={`edit-post-date-${book.book_id}`}
              name="post_date"
              type="datetime-local"
              defaultValue={book.post_date}
              className={inputClass}
            />
          </div>
        </div>
      </details>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending} className={buttonClass}>
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <StatusMessage result={result} />
      </div>
    </form>
  );
}
