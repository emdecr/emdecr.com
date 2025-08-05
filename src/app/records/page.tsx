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
    <main className="fade-in">
      <h1 className="text-2xl font-semibold mb-4">Records</h1>
      <ul className="space-y-2">
        {records.map((record) => (
          <li key={record.slug}>
            <Link href={`/records/${record.slug}`}>
              <strong>{record.title}</strong> — {record.date}
            </Link>
            <p className="text-sm">{record.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}