import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Home',
  description: 'Developer exploring opportunities at the intersection of technology and social change.',
}


export default function Home() {
  return (
    <main className="fade-in prose">
      <h1 className="text-3xl lg:text-4xl font-bold mb-4">Emily Dela Cruz</h1>
      
      <p className="text-xl leading-relaxed mb-4">I&rsquo;m a developer interested in the relationship between tech and social impact. This site is where I share what I&rsquo;m building and thinking about.</p>
      
      <p className="text-xl leading-relaxed mb-4">For the past decade, I&rsquo;ve spanned technical, user-focused, and operational roles &mdash; web development, UX research, marketing ops, and program management. If it sounds like I do a bit of everything, it&rsquo;s because curiosity and experience have opened those doors. I like solving practical problems, understanding systems, and helping teams work better.</p> 

      <p className="text-xl leading-relaxed mb-4">I&rsquo;m exploring what&rsquo;s next. If you want someone thoughtful who gets things done, <a href="mailto:hello@emilydelacruz.com">let&rsquo;s talk</a>.</p>

      <hr></hr>

      <p className="text-xl leading-relaxed mb-4">This site&rsquo;s going through a makeover + content overhaul. Stay tuned.</p>
    </main>
  );
}
