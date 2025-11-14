import type { Metadata } from 'next'
import Link from 'next/link';
import { getAllRecords } from '@/lib/markdown';

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Records',
  description: 'A collection of thoughts.',
}


export default async function RecordsPage() {
  const records = getAllRecords();

  return (
    <main className="records fade-in prose">
      <h1 className="text-2xl font-semibold mb-4">Records</h1>
      <p>Migrating content, but here&rsquo;s some posts for now...</p>
      <ul className="space-y-2 text-lg">
        {records.map((record) => (
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