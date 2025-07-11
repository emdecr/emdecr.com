import { notFound } from 'next/navigation';
import { getAllRecords, getRecordBySlug, Record as RecordType} from '@/lib/records';

type Props = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const records = getAllRecords();

  return records.map((record) => ({
    slug: record.slug,
  }));
}

export default async function RecordPage({ params }: Props) {
  const { slug } = await Promise.resolve(params);
  const record: RecordType | undefined = getRecordBySlug(slug);

  if (!record) notFound();

  const { type, title } = record.metadata;

  return (
    <article>
      <h1>{title}</h1>
      <p>Type: {type}</p>

      {type === 'book' && record.csvData && (
        <section>
          <h2>Book Info</h2>
          <p><strong>Author:</strong> {record.csvData.read_authors}</p>
          <p><strong>Year:</strong> {record.csvData.read_year}</p>
        </section>
      )}

      {type === 'film' && (
        <section>
          <h2>Film Details</h2>
          <p>(You could add logic to fetch or display film data here)</p>
        </section>
      )}

      {/* Markdown content */}
      <div dangerouslySetInnerHTML={{ __html: record.content }} />
    </article>
  );
}
