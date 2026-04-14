import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllRecords,
  getRecordBySlug,
  getRecordByRecordId,
  convertMarkdown,
  Record as RecordType,
} from '@/lib/records';
import { getBookBySlug, getCsvData, type BookCsvRow } from '@/lib/book-csv';
import {
  getBespokeRecord,
  getBespokeComponent,
  getAllBespokeRecords,
} from '@/lib/bespoke-records';

async function getTitleForSlug(slug: string): Promise<string | undefined> {
  const bespoke = getBespokeRecord(slug);
  if (bespoke) return bespoke.title;
  const record = await getRecordBySlug(slug);
  if (record) return record.metadata.title;
  const row = await getBookBySlug(slug);
  if (row) return row.read_title || row.post_title;
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

export async function generateStaticParams() {
  const records = getAllRecords();
  const books = await getCsvData();
  const bespoke = getAllBespokeRecords();
  const bookSlugs = books.map((row) => row.post_slug);
  const recordSlugs = records.map((r) => r.slug);
  const bespokeSlugs = bespoke.map((r) => r.slug);
  const slugs = [...new Set([...recordSlugs, ...bookSlugs, ...bespokeSlugs])];
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

export default async function RecordPage({ params }: Props) {
  const { slug } = await params;

  // Check for bespoke record first
  const bespokeMeta = getBespokeRecord(slug);
  if (bespokeMeta) {
    const Component = await getBespokeComponent(slug);
    if (Component) return <Component />;
  }

  let record: RecordType | undefined = await getRecordBySlug(slug);
  let csvRow: BookCsvRow | undefined = await getBookBySlug(slug);

  if (!record) {
    if (csvRow?.record_id) {
      record = getRecordByRecordId(csvRow.record_id);
      if (record) {
        record.csvData = csvRow;
      }
    }
    if (!record && csvRow) {
      const title = csvRow.read_title || csvRow.post_title;
      return (
        <article className="prose">
          <h1>{title}</h1>
          <BookMetadata row={csvRow} />
        </article>
      );
    }
    if (!record) notFound();
  }

  const { contentHtml } = await convertMarkdown(record.content);
  const { type, title } = record.metadata;
  const csvData = record.csvData as BookCsvRow | undefined;

  return (
    <article className="prose">
      <h1>{title}</h1>
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
