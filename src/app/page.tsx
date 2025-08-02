import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Home',
  description: 'Developer exploring opportunities at the intersection of technology and social change.',
}


export default function Home() {
  return (
    <main className="fade-in">
      <h1 className="lg:text-4xl font-bold mb-4">Emily Dela Cruz</h1>
      <p className="text-base leading-relaxed mb-4">I&lsquo;m a developer exploring opportunities at the intersection of technology and social change.</p>
    </main>
  );
}
