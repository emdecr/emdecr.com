import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Home',
  description: 'Developer exploring opportunities at the intersection of technology, connection, and social change.',
}


export default function Home() {
  return (
    <main className="fade-in">
      <h1 className="text-xl font-bold mb-4">Hi, I&apos;m Emily Dela Cruz 👋</h1>
      <p className="text-base leading-relaxed mb-4">A developer exploring opportunities at the intersection of technology, connection, and social change.</p>
      <p className="text-base leading-relaxed"><em>This site is under construction. But while you&apos;re here, here&apos;s a few words...</em></p>
    </main>
  );
}
