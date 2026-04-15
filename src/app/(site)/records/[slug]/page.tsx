import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllRecords,
  getRecordBySlug,
  convertMarkdown,
  Record as RecordType,
} from '@/lib/records';
import { type BookCsvRow } from '@/lib/book-csv';
import {
  getBespokeRecord,
  getBespokeComponent,
  getAllBespokeRecords,
} from '@/lib/bespoke-records';

/**
 * Resolve a page title for metadata generation.
 * Books without notes (no record_id / no linked markdown) no longer have
 * their own pages, so we only check bespoke and markdown records here.
 */
async function getTitleForSlug(slug: string): Promise<string | undefined> {
  const bespoke = getBespokeRecord(slug);
  if (bespoke) return bespoke.title;
  const record = await getRecordBySlug(slug);
  if (record) return record.metadata.title;
  return undefined;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const title = await getTitleForSlug(slug);
  if (!title) return { title: 'Not Found' };
  return { title };
}

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * Generate static params for all record pages at build time.
 *
 * Books no longer generate their own pages by post_slug — only books
 * with notes (a linked markdown record via record_id) get pages, and
 * those are already included through the markdown records list.
 */
export async function generateStaticParams() {
  const records = getAllRecords();
  const bespoke = getAllBespokeRecords();
  const recordSlugs = records.map((r) => r.slug);
  const bespokeSlugs = bespoke.map((r) => r.slug);
  const slugs = [...new Set([...recordSlugs, ...bespokeSlugs])];
  return slugs.map((slug) => ({ slug }));
}

function BookMetadata({ row }: { row: BookCsvRow }) {
  return (
    <section className="not-prose mb-6">
      <div className="flex gap-4">
        {row.read_image ? (
          <img
            src={row.read_image}
            alt=""
            width={160}
            height={240}
            className="object-cover rounded border border-gray-200 shrink-0"
          />
        ) : null}
        <dl className="grid gap-1 text-sm">
          {row.read_authors ? (
            <div>
              <dt className="font-medium text-gray-500">Author</dt>
              <dd>{row.read_authors}</dd>
            </div>
          ) : null}
          {row.read_year ? (
            <div>
              <dt className="font-medium text-gray-500">Year</dt>
              <dd>{row.read_year}</dd>
            </div>
          ) : null}
          {row.read_publisher ? (
            <div>
              <dt className="font-medium text-gray-500">Publisher</dt>
              <dd>{row.read_publisher}</dd>
            </div>
          ) : null}
          {row.read_isbn ? (
            <div>
              <dt className="font-medium text-gray-500">ISBN</dt>
              <dd>{row.read_isbn}</dd>
            </div>
          ) : null}
          {row.read_rating ? (
            <div>
              <dt className="font-medium text-gray-500">Rating</dt>
              <dd>{row.read_rating}</dd>
            </div>
          ) : null}
          {row.read_link ? (
            <div>
              <dt className="font-medium text-gray-500">Link</dt>
              <dd>
                <a href={row.read_link} target="_blank" rel="noopener noreferrer" className="underline">
                  {new URL(row.read_link.startsWith('http') ? row.read_link : `https://${row.read_link}`).hostname}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}

/**
 * Renders a single record page (book notes, film review, article, etc.).
 *
 * Resolution order:
 *   1. Bespoke records — custom React components in src/lib/bespoke-records
 *   2. Markdown records — .md files in content/records/
 *
 * For book-type markdown records, getRecordBySlug() automatically enriches
 * the record with CSV metadata (cover, author, rating, etc.) by matching
 * the frontmatter record_id to a book row. See src/lib/records.ts for
 * that enrichment logic.
 *
 * Books without a linked markdown record (no record_id) do not have pages
 * — they appear only as static cards on the /bookshelf grid.
 */
export default async function RecordPage({ params }: Props) {
  const { slug } = await params;

  // 1. Check for bespoke (custom component) records first
  const bespokeMeta = getBespokeRecord(slug);
  if (bespokeMeta) {
    const Component = await getBespokeComponent(slug);
    if (Component) return <Component />;
  }

  // 2. Look up the markdown record by slug.
  //    For book-type records, getRecordBySlug() automatically
  //    enriches with CSV data via record_id (see src/lib/records.ts).
  const record = await getRecordBySlug(slug);
  if (!record) notFound();

  const { contentHtml } = await convertMarkdown(record.content);
  const { type, title } = record.metadata;
  const csvData = record.csvData as BookCsvRow | undefined;

  return (
    <article className="prose">
      <h1>{title}</h1>
      {/* Book-type records get a metadata sidebar (cover, author, rating, etc.)
          pulled from the CSV/Supabase book row via record_id linking. */}
      {type === 'book' && csvData && (
        <BookMetadata row={csvData} />
      )}

      {type === 'film' && (
        <section>
          <h2>Film Details</h2>
          <p>(You could add logic to fetch or display film data here)</p>
        </section>
      )}

      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </article>
  );
}
