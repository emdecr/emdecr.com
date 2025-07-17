import type { Metadata } from 'next'
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - About',
  description: 'Developer exploring opportunities at the intersection of technology, connection, and social change.',
}


export default function About() {
  return (
    <main className="fade-in">
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <Link href="/about/now" className="hover:underline">
        /about/now
      </Link>
    </main>
  );
}
