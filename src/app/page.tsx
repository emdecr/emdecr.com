import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Home',
  description: 'Developer exploring opportunities at the intersection of technology and social change.',
}


export default function Home() {
  return (
    <main className="fade-in prose">
      <h1 className="text-3xl lg:text-4xl font-bold mb-4">Emily Dela Cruz</h1>
      
      <p className="text-xl leading-relaxed mb-4">I&rsquo;m a developer exploring opportunities at the intersection of technology and social change. This site is where I share what I&rsquo;m working on and thinking about.</p>
      
      <p className="text-xl leading-relaxed mb-4">I&rsquo;ve spent the last decade working across the full stack of development...and then some. Leading websites redesigns, delving into UXR, marketing operations, program management, etc.</p> 

      <p className="text-xl leading-relaxed mb-4">If it sounds like I do a bit of everything, it&rsquo;s because my experience and curiosity has given me the opportunity to do so. I simply like solving practical problems, understanding how systems fit together, and helping teams work more smoothly.</p>
      
      <p className="text-xl leading-relaxed mb-4">Right now, I&rsquo;m exploring what&rsquo;s next in my career. If you want someone who&rsquo;s thoughtful and gets things done, let&rsquo;s chat.</p>
    </main>
  );
}
