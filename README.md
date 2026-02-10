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

#### Structured Data (`data/`)

CSV files store structured content that's parsed at runtime:

- **`bookmarks.csv`**: Web bookmarks with metadata (title, link, image, notes)
- **`books.csv`**: Reading list with book metadata linked to records via `record_id`
- **`music-rotation.csv`**: Currently listening tracks
- **`life-in-weeks.json`**: Life calendar visualization data

### Data Processing

The `src/lib/` directory contains utilities for content processing:

- **`markdown.ts`**: Functions to read and process markdown files, extract frontmatter, and convert to HTML
- **`records.ts`**: Record-specific processing with markdown-to-HTML conversion using remark/rehype
- **`bookmarks.ts`**: CSV parsing for bookmarks with date sorting
- **`book-csv.ts`**: Book data lookup utilities with caching
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

### Build & Deployment

- **Static Generation**: Records are pre-rendered at build time via `generateStaticParams`
- **RSS Feed**: Generated dynamically via API route handler with hourly revalidation
- **No Runtime Database**: All content is file-based, making deployments simple and portable

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