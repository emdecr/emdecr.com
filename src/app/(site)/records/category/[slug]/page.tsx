import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCategories, getRecordsByCategory } from '@/lib/records';

function formatCategoryName(slug: string): string {
  return slug.replace(/-/g, ' ');
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Emily Dela Cruz - ${formatCategoryName(slug)}`,
    description: `Records in the category: ${formatCategoryName(slug)}.`,
  };
}

export function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const records = getRecordsByCategory(slug);

  if (records.length === 0) {
    notFound();
  }

  return (
    <main className="records fade-in prose">
      <h1 className="text-2xl font-semibold mb-4">{formatCategoryName(slug)}</h1>
      <p>
        <Link href="/records/category" prefetch={false}>&larr; All categories</Link>
      </p>
      <ul className="space-y-2 text-lg">
        {records.map((record) => (
          <li key={record.slug}>
            <Link href={`/records/${record.slug}`} prefetch={false}>
              <strong>{record.title}</strong> — {record.date}
            </Link>
            <p className="text-sm m-0">{record.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
