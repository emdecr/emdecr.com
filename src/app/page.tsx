import type { Metadata } from 'next'
import Link from "next/link";
import { getMarkdownContent } from '@/lib/records';

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Home',
  description: 'Developer exploring opportunities at the intersection of technology and social change.',
}


export default async function Home() {
  const { contentHtml } = await getMarkdownContent('home.md');

  return (
    <main className="fade-in prose">
      <article dangerouslySetInnerHTML={{ __html: contentHtml }}></article>

      <hr />

      <p className="text-xl">This site is a home for current projects and ideas:</p>

      <ul className="text-xl">
        <li>
          <Link href="/work" className="underline">
            Work
          </Link>
        </li>
        <li>
          <Link href="/records" className="underline">
            Articles
          </Link>
        </li>
        <li>
          <Link href="/bookmarks" className="underline">
            Recommended links
          </Link>
        </li>
        <li>
          <Link href="/bookshelf" className="underline">
            Bookshelf
          </Link>
        </li>
      </ul>

    </main>
  );
}
