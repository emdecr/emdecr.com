import type { Metadata } from 'next'
import Link from "next/link";
import { getMarkdownContent } from '@/lib/markdown';
 
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

      <p className="text-xl">This site is a home for current projects and ideas. It&rsquo;s undergoing a redesign and content refresh, but in the meantime you can explore:</p>

      <ul className="text-xl">
        <li>
          <Link
              href="/records"
              rel="noopener noreferrer"
              className="underline">
              Articles
          </Link>
        </li>
        <li>
          <Link
              href="/bookmarks"
              rel="noopener noreferrer"
              className="underline">
              Recommended links
          </Link>
        </li>
        <li>
          <Link
              href="/bookshelf"
              rel="noopener noreferrer"
              className="underline">
              Bookshelf
          </Link>
        </li>
      </ul>

    </main>
  );
}
