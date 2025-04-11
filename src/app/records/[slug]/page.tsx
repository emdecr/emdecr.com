// src/app/records/[slug]/page.tsx
import { getRecordBySlug } from '../../../lib/markdown';

type Props = {
  params: { slug: string };
};

export default async function RecordPage({ params }: Props) {
  const { slug } = await params;  // Destructure the slug from params

  // Fetch the record data asynchronously
  const record = await getRecordBySlug(slug);

  return (
    <div>
      <h1>{record.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: record.contentHtml }} />
    </div>
  );
}
