import type { Metadata } from 'next'
import Link from 'next/link';
import { getAllRecords } from '@/lib/records';
import { getAllBespokeRecords } from '@/lib/bespoke-records';

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Records',
  description: 'A collection of thoughts.',
}


export default async function RecordsPage() {
  const markdownRecords = getAllRecords();
  const bespokeRecords = getAllBespokeRecords();

  const allRecords = [
    ...markdownRecords.map((r) => ({
      slug: r.slug,
      title: r.metadata.title,
      date: r.metadata.date,
      summary: r.metadata.summary,
    })),
    ...bespokeRecords.map((r) => ({
      slug: r.slug,
      title: r.title,
      date: r.date,
      summary: r.summary,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="records fade-in prose">
      <h1 className="text-2xl font-semibold mb-4">Records</h1>
      <p>Migrating content, but here&rsquo;s some posts for now...</p>
      <ul className="space-y-2 text-lg">
        {allRecords.map((record) => (
          <li key={record.slug}>
            <Link href={`/records/${record.slug}`}>
              <strong>{record.title}</strong> — {record.date}
            </Link>
            <p className="text-sm m-0">{record.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}