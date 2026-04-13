/**
 * /ctrl — Admin dashboard.
 *
 * Landing page after login. Just links to the two admin tools.
 * Keeping it simple — this is a personal admin, not a CMS.
 */

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-lg font-bold mb-6">Dashboard</h1>

      <div className="space-y-3">
        <a
          href="/ctrl/bookmarks"
          className="block border border-gray-200 rounded p-4 hover:bg-gray-50"
        >
          <span className="font-medium">Bookmarks</span>
          <span className="block text-sm text-gray-500 mt-1">
            Add or edit recent bookmarks
          </span>
        </a>

        <a
          href="/ctrl/books"
          className="block border border-gray-200 rounded p-4 hover:bg-gray-50"
        >
          <span className="font-medium">Books</span>
          <span className="block text-sm text-gray-500 mt-1">
            Add or edit recent books, upload cover images
          </span>
        </a>
      </div>
    </div>
  );
}
