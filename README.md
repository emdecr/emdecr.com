# emilydelacruz.com

A personal website built with [Next.js](https://nextjs.org) using a file-based content management approach. No database, no CMS—just markdown files and CSV data processed at build time.

## Architecture Overview

### Framework & Stack

- **Next.js 16** with App Router for server-side rendering and static site generation
- **TypeScript** for type safety
- **Tailwind CSS** with `@tailwindcss/typography` for styling
- **React 19** for the UI layer

### Content Management

The site uses a file-based content system with two main content types:

#### Markdown Content (`content/`)

- **Records** (`content/records/`): Blog posts and articles stored as markdown files with frontmatter
  - Frontmatter includes: `title`, `date`, `slug`, `summary`, `status` (published/draft/hidden)
  - Processed at build time using `gray-matter` and `remark`/`rehype` pipelines
  - Dynamically routed via `[slug]` dynamic routes with static generation

- **Pages** (`content/pages/`): Static pages like `about.md`, `home.md`, `now.md`
  - Same markdown processing pipeline as records
  - Rendered server-side in their respective page components

#### Structured Data (`data/` and optional Supabase)

Bookmarks and bookshelf can come from **Supabase** (no rebuild to update) or **CSV fallback**:

- **With Supabase**: Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`. The app fetches from the `bookmarks` and `books` tables. Use the Supabase dashboard or API to edit data; changes show after revalidation (no deploy). See `.env.example`.
- **Without Supabase** (or if either env var is missing): The app reads from `data/bookmarks.csv` and `data/books.csv`. Edit the CSVs and redeploy to update.

Other data remains file-based:

- **`bookmarks.csv`** / **`books.csv`**: Used when Supabase is not configured (see above).
- **`music-rotation.csv`**: Currently listening tracks
- **`life-in-weeks.json`**: Life calendar visualization data

### Data Processing

The `src/lib/` directory contains utilities for content processing:

- **`markdown.ts`**: Functions to read and process markdown files, extract frontmatter, and convert to HTML
- **`records.ts`**: Record-specific processing with markdown-to-HTML conversion using remark/rehype
- **`data-source.ts`**: Fetches bookmarks and books from Supabase (when env is set) or falls back to CSV; uses Next.js cache with revalidation.
- **`bookmarks.ts`**: Loads bookmarks via data-source (date-sorted).
- **`book-csv.ts`**: Book/bookshelf lookups via data-source; current book from Supabase `is_current` or `config.currentBookId` when using CSV.
- **`music-rotation.ts`**: Track data processing from CSV
- **`github.ts`**: Fetches latest GitHub activity via RSS feed parsing

### Routing & Pages

- **`/`**: Home page
- **`/records`**: List of all published records
- **`/records/[slug]`**: Individual record pages (statically generated)
- **`/records/feed.xml`**: RSS feed (rewritten from `/records/feed` route handler)
- **`/about`**: About page from markdown
- **`/now`**: "Now" page combining markdown content with dynamic data (current book, GitHub activity, latest bookmark, music)
- **`/bookmarks`**: Bookmark listing page
- **`/life-in-weeks`**: Life calendar visualization

### Supabase setup (optional)

To use Supabase for bookmarks and bookshelf:

1. Create a Supabase project and run the migration in `supabase/migrations/001_bookmarks_and_books.sql` (Table Editor > SQL or `supabase db push` if using Supabase CLI).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env.local` (see `.env.example`).
3. Import data: use the Table Editor CSV import for `bookmarks` and `books`, or run `scripts/import-csv-to-supabase.ts`. Set `is_current = true` on one book to show it as "currently reading" on the Now page.

### Build & Deployment

- **Static Generation**: Records are pre-rendered at build time via `generateStaticParams`
- **RSS Feed**: Generated dynamically via API route handler with hourly revalidation
- **Bookmarks/bookshelf**: From Supabase when configured (with revalidation), or from CSV at build/request time

### Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Key Dependencies

- **Content Processing**: `gray-matter`, `remark`, `remark-html`, `rehype-raw`
- **Data Parsing**: `csv-parse` for CSV files
- **External APIs**: `rss-parser` for GitHub activity feed
- **Styling**: `tailwindcss`, `@tailwindcss/typography`

This architecture prioritizes simplicity, portability, and performance—content lives in version control, builds are fast, and the site can be deployed anywhere that serves static files.