import type { Metadata } from 'next'
// import Link from 'next/link';
import Image from 'next/image'
import { getMarkdownContent } from '@/lib/markdown';

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - About',
  description: 'Developer exploring opportunities at the intersection of technology and social change.',
}


export default async function About() {
  const { contentHtml } = await getMarkdownContent('about.md');
  return (
    <main className="fade-in">
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <div className="lg:grid gap-12 grid-cols-5">
        <div className="col-span-3">
          <article className="prose" dangerouslySetInnerHTML={{ __html: contentHtml }}></article>
        </div>
        <figure className="col-span-2">
          <Image 
            src="/images/blind-contour-miles.jpg" 
            alt="Blind contour portrait"
            width="400"
            height="1000"
          />
          <figcaption className="text-xs font-mono mt-4 text-slate-500">Blind contour portraits of myself made by my nephew (8). I think it&apos;s a striking resemblance.</figcaption>
        </figure>
      </div>  
    </main>
  );
}
