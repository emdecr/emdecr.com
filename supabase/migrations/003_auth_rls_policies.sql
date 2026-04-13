-- Row Level Security for bookmarks and books tables.
--
-- The 001 migration created these tables without RLS.
-- This migration enables RLS and adds policies so that:
--   - Anyone can READ (the public site uses the anon key for reads)
--   - Only authenticated users can INSERT and UPDATE (the /ctrl admin uses a JWT)
--
-- There's only one admin user, but we gate on auth.uid() IS NOT NULL rather
-- than a specific UUID — simpler, and there's no risk since there's only
-- one user in the Supabase Auth database.
--
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent — safe to run
-- even if RLS was already enabled manually in the dashboard.

-- ─── Bookmarks ───────────────────────────────────────────────────────────────

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Anyone can read bookmarks (public site, anon key)
CREATE POLICY "Public read access"
  ON bookmarks
  FOR SELECT
  USING (true);

-- Only authenticated users can add new bookmarks
CREATE POLICY "Auth insert bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can edit existing bookmarks
CREATE POLICY "Auth update bookmarks"
  ON bookmarks
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── Books ───────────────────────────────────────────────────────────────────

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Anyone can read books (public site, anon key)
CREATE POLICY "Public read access"
  ON books
  FOR SELECT
  USING (true);

-- Only authenticated users can add new books
CREATE POLICY "Auth insert books"
  ON books
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can edit existing books
-- (needed for toggling is_current and editing recent entries)
CREATE POLICY "Auth update books"
  ON books
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
