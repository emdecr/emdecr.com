-- Master migration: creates all tables, enables RLS, and sets up policies.
-- Run this once on a fresh Supabase project to set up the full schema.
--
-- For test/seed data, run seed-travels.sql separately after this migration.
--
-- Tables:
--   1. bookmarks — links saved from around the web
--   2. books     — reading list, with cover images and "currently reading" tracking
--   3. travels   — travel pins for the interactive /travels map


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BOOKMARKS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Bookmarks table: matches the Bookmark type in src/lib/data-source.ts.
-- Data source priority: Supabase first, /data/bookmarks.csv fallback.
CREATE TABLE IF NOT EXISTS bookmarks (
  bookmark_id    text PRIMARY KEY,
  bookmark_date  timestamptz,
  bookmark_title text,
  bookmark_link  text,
  bookmark_image text,
  bookmark_note  text
);

-- RLS: anyone can read, only authenticated users can insert/update.
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON bookmarks FOR SELECT
  USING (true);

CREATE POLICY "Auth insert bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth update bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. BOOKS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Books table: matches BookCsvRow in src/lib/data-source.ts + is_current flag.
-- Data source priority: Supabase first, /data/books.csv fallback.
--
-- Note: book_id, read_year, and read_isbn are bigint (not text) because the
-- CSV import inferred numeric types from the data. The admin code in
-- src/app/(admin)/ctrl/books/actions.ts uses toBigintOrNull() to match.
CREATE TABLE IF NOT EXISTS books (
  book_id        bigint PRIMARY KEY,
  record_id      text,
  post_title     text,
  post_slug      text,
  post_date      timestamptz,
  read_title     text,
  read_subtitle  text,
  read_authors   text,
  read_date      text,
  read_year      bigint,
  read_rating    text,
  read_link      text,
  read_isbn      bigint,
  read_publisher text,
  read_image     text,
  is_current     boolean NOT NULL DEFAULT false
);

-- At most one book can be "currently reading" at a time.
-- The admin's createBook/updateBook actions clear this flag on other rows
-- before setting it on the new current book.
CREATE UNIQUE INDEX IF NOT EXISTS books_is_current_true_unique
  ON books (is_current) WHERE is_current = true;

COMMENT ON COLUMN books.is_current IS
  'When true, this book is shown as "currently reading" on the Now page. Only one row should be true.';

-- RLS: anyone can read, only authenticated users can insert/update.
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON books FOR SELECT
  USING (true);

CREATE POLICY "Auth insert books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth update books"
  ON books FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TRAVELS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Travels table: stores travel pin data for the /travels interactive map.
-- Matches the Travel type in src/lib/travels.ts.
-- Data source priority: Supabase first, /data/travels.json fallback.
CREATE TABLE IF NOT EXISTS travels (
  id          text PRIMARY KEY,                -- Unique kebab-case identifier, e.g. "london-2024"
  name        text NOT NULL,                   -- Display name: city, region, or area
  country     text NOT NULL,                   -- Country or state name
  lat         double precision NOT NULL,       -- Latitude (north is positive)
  lng         double precision NOT NULL,       -- Longitude (east is positive)
  date        text NOT NULL,                   -- Start date as partial ISO: "2024-03" or "2024-03-15"
  date_end    text,                            -- End date (same format), null for single dates
  images      jsonb DEFAULT '[]'::jsonb,       -- Array of image path strings
  record_slug text,                            -- Links to /records/[slug] article, null if no article
  note        text,                            -- Short description for tooltip and card
  status      text NOT NULL DEFAULT 'visited', -- 'visited' or 'wishlist'
  created_at  timestamptz DEFAULT now()        -- Row creation timestamp
);

COMMENT ON TABLE travels IS 'Travel locations displayed as pins on the /travels interactive map.';
COMMENT ON COLUMN travels.images IS 'JSONB array of image paths relative to /public, e.g. ["/images/travels/pic.jpg"]';
COMMENT ON COLUMN travels.record_slug IS 'Slug for a related /records/[slug] article. Null if no write-up exists.';
COMMENT ON COLUMN travels.status IS 'Pin type: visited (been there) or wishlist (want to go). Affects pin styling on the map.';

-- RLS: anyone can read. No write policies yet — travels are managed directly
-- in the Supabase dashboard for now.
ALTER TABLE travels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON travels FOR SELECT
  USING (true);
