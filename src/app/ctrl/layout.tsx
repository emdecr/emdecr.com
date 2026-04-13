/**
 * /ctrl layout — Wraps all admin pages.
 *
 * This is a separate layout from the main site (src/app/layout.tsx).
 * It does NOT include the site's GlobalNav or footer — the admin section
 * is its own self-contained UI.
 *
 * The nav shows links to the admin pages and a logout button.
 * The login page also gets this layout, which is fine — the middleware
 * handles access control, not the layout.
 */

import { logout } from './login/actions';

export const metadata = {
  title: 'Admin',
  robots: 'noindex, nofollow', // keep admin pages out of search engines
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Admin navigation bar */}
      <nav className="flex items-center gap-4 text-sm mb-8 pb-4 border-b border-gray-200">
        <a href="/ctrl" className="font-bold">
          Admin
        </a>
        <a href="/ctrl/bookmarks" className="hover:underline">
          Bookmarks
        </a>
        <a href="/ctrl/books" className="hover:underline">
          Books
        </a>

        {/* Spacer pushes logout to the right */}
        <div className="ml-auto flex items-center gap-4">
          <a href="/" className="text-gray-500 hover:underline">
            &larr; Site
          </a>

          {/* Logout is a form with a server action — no JS click handler needed.
              The form submits to the logout server action which clears the
              session cookie and redirects to /ctrl/login. */}
          <form action={logout}>
            <button
              type="submit"
              className="text-gray-500 hover:underline"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>

      {children}
    </div>
  );
}
