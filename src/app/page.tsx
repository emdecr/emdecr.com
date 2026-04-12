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

      <p className="text-xl">This site is a home for:</p>

      <ul className="text-xl">
        <li>
          <Link href="/work" prefetch={false} className="underline">
            Work
          </Link>
        </li>
        <li>
          <Link href="/records" prefetch={false} className="underline">
            Articles
          </Link>
        </li>
        <li>
          <Link href="/bookmarks" prefetch={false} className="underline">
            Recommended links
          </Link>
        </li>
        <li>
          <Link href="/bookshelf" prefetch={false} className="underline">
            Bookshelf
          </Link>
        </li>
      </ul>

    </main>
  );
}
