/**
 * Client-side bookmark forms — create and edit.
 *
 * These are "use client" components because they use useActionState
 * (React 19) to submit server actions and show inline feedback.
 *
 * Both forms share the same field layout (DRY without over-abstracting —
 * the fields are just repeated since there are only 5 of them and the
 * create vs. edit forms have slightly different defaults and labels).
 */
'use client';

import { useActionState } from 'react';
import { createBookmark, updateBookmark } from './actions';
import type { ActionResult } from './actions';
import type { Bookmark } from '@/lib/data-source';

// ─── Shared styles ───────────────────────────────────────────────────────────
// Keeping these as simple strings so the forms are easy to read and tweak.

const labelClass = 'block text-sm mb-1';
const inputClass =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black';
const buttonClass =
  'bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';

// ─── Status message ──────────────────────────────────────────────────────────
// Shows success (green) or error (red) feedback after form submission.

function StatusMessage({ result }: { result: ActionResult }) {
  if (!result) return null;

  const color = result.status === 'success' ? 'text-green-700' : 'text-red-600';
  return <p className={`text-sm ${color} mt-2`}>{result.message}</p>;
}

// ─── Helper: format a date string for datetime-local input ───────────────────
// datetime-local inputs expect "YYYY-MM-DDTHH:MM" format.
// Supabase returns ISO strings like "2025-11-24T15:25:00+00:00".
function toDatetimeLocal(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  // Pad to 2 digits
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Create Form ─────────────────────────────────────────────────────────────

export function BookmarkCreateForm() {
  const [result, formAction, isPending] = useActionState(createBookmark, null);

  return (
    <form action={formAction} className="space-y-3 border border-gray-200 rounded p-4">
      <div>
        <label htmlFor="create-title" className={labelClass}>Title *</label>
        <input id="create-title" name="bookmark_title" type="text" required className={inputClass} />
      </div>

      <div>
        <label htmlFor="create-link" className={labelClass}>Link *</label>
        <input id="create-link" name="bookmark_link" type="url" required className={inputClass} />
      </div>

      <div>
        <label htmlFor="create-image" className={labelClass}>Image URL</label>
        <input id="create-image" name="bookmark_image" type="url" className={inputClass} />
      </div>

      <div>
        <label htmlFor="create-note" className={labelClass}>Note</label>
        <textarea id="create-note" name="bookmark_note" rows={2} className={inputClass} />
      </div>

      <div>
        <label htmlFor="create-date" className={labelClass}>Date</label>
        <input
          id="create-date"
          name="bookmark_date"
          type="datetime-local"
          className={inputClass}
          // Default to right now — the server action also defaults if empty
        />
        <p className="text-xs text-gray-400 mt-1">Leave blank for current time</p>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={buttonClass}>
          {isPending ? 'Adding...' : 'Add Bookmark'}
        </button>
        <StatusMessage result={result} />
      </div>
    </form>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────
// Pre-filled with the bookmark's current values. Each recent bookmark
// gets its own independent form with its own submit button.

export function BookmarkEditForm({ bookmark }: { bookmark: Bookmark }) {
  const [result, formAction, isPending] = useActionState(updateBookmark, null);

  return (
    <form action={formAction} className="space-y-3 border border-gray-200 rounded p-4">
      {/* Hidden field — tells the server action which bookmark to update */}
      <input type="hidden" name="bookmark_id" value={bookmark.bookmark_id} />

      {/* ID badge so you can tell bookmarks apart at a glance */}
      <p className="text-xs text-gray-400">ID: {bookmark.bookmark_id}</p>

      <div>
        <label htmlFor={`edit-title-${bookmark.bookmark_id}`} className={labelClass}>Title *</label>
        <input
          id={`edit-title-${bookmark.bookmark_id}`}
          name="bookmark_title"
          type="text"
          required
          defaultValue={bookmark.bookmark_title}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`edit-link-${bookmark.bookmark_id}`} className={labelClass}>Link *</label>
        <input
          id={`edit-link-${bookmark.bookmark_id}`}
          name="bookmark_link"
          type="url"
          required
          defaultValue={bookmark.bookmark_link}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`edit-image-${bookmark.bookmark_id}`} className={labelClass}>Image URL</label>
        <input
          id={`edit-image-${bookmark.bookmark_id}`}
          name="bookmark_image"
          type="url"
          defaultValue={bookmark.bookmark_image}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`edit-note-${bookmark.bookmark_id}`} className={labelClass}>Note</label>
        <textarea
          id={`edit-note-${bookmark.bookmark_id}`}
          name="bookmark_note"
          rows={2}
          defaultValue={bookmark.bookmark_note}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`edit-date-${bookmark.bookmark_id}`} className={labelClass}>Date</label>
        <input
          id={`edit-date-${bookmark.bookmark_id}`}
          name="bookmark_date"
          type="datetime-local"
          defaultValue={toDatetimeLocal(bookmark.bookmark_date)}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={buttonClass}>
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <StatusMessage result={result} />
      </div>
    </form>
  );
}
