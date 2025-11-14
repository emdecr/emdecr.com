import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getAllRecords, 
  getRecordBySlug, 
  convertMarkdown, 
  Record as RecordType 
} from '@/lib/records';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  const record = getRecordBySlug(slug);
  if (!record) return { title: 'Not Found' };

  const { title } = record.metadata;

  return {
    title
  };
}

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const records = getAllRecords();

  return records.map((record) => ({
    slug: record.slug,
  }));
}

export default async function RecordPage({ params }: Props) {
  const { slug } = await params;
  const record: RecordType | undefined = getRecordBySlug(slug);

  if (!record) notFound();

  const { contentHtml } = await convertMarkdown(record.content);
  const { type, title } = record.metadata;

  return (
    <article className="prose">
      <h1>{title}</h1>
      {/* 
      {type === 'book' && record.csvData && (
        <section>
          <h2>Book Info</h2>
          <p><strong>Author:</strong> {record.csvData.read_authors}</p>
          <p><strong>Year:</strong> {record.csvData.read_year}</p>
        </section>
      )} */}

      {type === 'film' && (
        <section>
          <h2>Film Details</h2>
          <p>(You could add logic to fetch or display film data here)</p>
        </section>
      )}

      {/* Markdown content */}
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </article>
  );
}
