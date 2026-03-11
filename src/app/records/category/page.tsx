import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllCategories, getRecordsByCategory } from '@/lib/records';

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Categories',
  description: 'Browse records by category.',
};

function formatCategoryName(slug: string): string {
  return slug.replace(/-/g, ' ');
}

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <main className="records fade-in prose">
      <h1 className="text-2xl font-semibold mb-4">Categories</h1>
      <ul className="space-y-2 text-lg">
        {categories.map((category) => {
          const count = getRecordsByCategory(category).length;
          return (
            <li key={category}>
              <Link href={`/records/category/${category}`}>
                {formatCategoryName(category)}
              </Link>
              <span className="text-sm text-gray-500 ml-2">({count})</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
