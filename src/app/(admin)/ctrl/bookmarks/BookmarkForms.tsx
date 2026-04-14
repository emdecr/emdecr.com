/**
 * Client-side bookmark forms — create and edit.
 *
 * These are "use client" components because they use useActionState
 * (React 19) to submit server actions and show inline feedback.
 *
 * The edit forms use native <details> elements for an accordion-style
 * layout — each recent bookmark is collapsed by default, showing just
 * the title and date. Click to expand and edit.
 */
'use client';

import { useActionState } from 'react';
import { createBookmark, updateBookmark } from './actions';
import type { ActionResult } from './actions';
import type { Bookmark } from '@/lib/data-source';

// ─── Shared styles ───────────────────────────────────────────────────────────

const labelClass = 'block text-sm mb-1';
const inputClass =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black';
const buttonClass =
  'bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';

// ─── Status message ──────────────────────────────────────────────────────────

function StatusMessage({ result }: { result: ActionResult }) {
  if (!result) return null;
  const color = result.status === 'success' ? 'text-green-700' : 'text-red-600';
  return <p className={`text-sm ${color} mt-2`}>{result.message}</p>;
}

// ─── Helper: format a date string for datetime-local input ───────────────────
// datetime-local inputs expect "YYYY-MM-DDTHH:MM" format.
function toDatetimeLocal(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Helper: format a date for the accordion summary line ────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

// ─── Edit Form (accordion item) ─────────────────────────────────────────────
// Each bookmark is a <details> element — collapsed by default, showing a
// summary line with the title and date. Click to expand the full edit form.

export function BookmarkEditForm({ bookmark }: { bookmark: Bookmark }) {
  const [result, formAction, isPending] = useActionState(updateBookmark, null);

  return (
    <details className="border border-gray-200 rounded group">
      {/* Summary line — always visible. Shows title + date at a glance. */}
      <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-gray-50">
        <span className="font-medium text-sm truncate mr-4">
          {bookmark.bookmark_title}
        </span>
        <span className="text-xs text-gray-400 shrink-0">
          {formatDate(bookmark.bookmark_date)}
        </span>
      </summary>

      {/* Edit form — revealed on expand */}
      <form action={formAction} className="space-y-3 px-4 pb-4 pt-2 border-t border-gray-100">
        <input type="hidden" name="bookmark_id" value={bookmark.bookmark_id} />

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
    </details>
  );
}
