-- Bookmarks table: matches Bookmark type (bookmark_id, bookmark_date, bookmark_title, bookmark_link, bookmark_image, bookmark_note)
CREATE TABLE IF NOT EXISTS bookmarks (
  bookmark_id text PRIMARY KEY,
  bookmark_date timestamptz,
  bookmark_title text,
  bookmark_link text,
  bookmark_image text,
  bookmark_note text
);

-- Books table: matches BookCsvRow + is_current for "current book" on Now page
CREATE TABLE IF NOT EXISTS books (
  book_id text PRIMARY KEY,
  record_id text,
  post_title text,
  post_slug text,
  post_date timestamptz,
  read_title text,
  read_subtitle text,
  read_authors text,
  read_date text,
  read_year text,
  read_rating text,
  read_link text,
  read_isbn text,
  read_publisher text,
  read_image text,
  is_current boolean NOT NULL DEFAULT false
);

-- At most one book should be is_current; partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS books_is_current_true_unique
  ON books (is_current) WHERE is_current = true;

COMMENT ON COLUMN books.is_current IS 'When true, this book is shown as "currently reading" on the Now page. Only one row should be true.';
