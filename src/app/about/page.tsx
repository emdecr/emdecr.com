import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Emily Dela Cruz - About',
  description: 'Developer exploring opportunities at the intersection of technology, connection, and social change.',
}


export default function About() {
  return (
    <main className="fade-in">
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <p className="text-base leading-relaxed">
        /about
      </p>
    </main>
  );
}
