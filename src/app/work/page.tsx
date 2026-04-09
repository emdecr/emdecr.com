import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllWorkItems, type WorkMetadata } from '@/lib/work';
import { convertMarkdown } from '@/lib/records';

export const metadata: Metadata = {
  title: 'Emily Dela Cruz - Work',
  description: 'A closer look at some of the work I\'ve done — performant, accessible, and maintainable web systems.',
};

const typeLabels: Record<WorkMetadata['type'], string> = {
  'role': 'F/T Position',
  'side-project': 'Side Project',
  'research': 'Research',
  'personal-project': 'Personal Project',
};

function WorkEntry({
  metadata,
  contentHtml,
}: {
  metadata: WorkMetadata;
  contentHtml: string;
}) {
  const typeLabel = typeLabels[metadata.type];

  return (
    <section className="mb-16">
      <header className="not-prose mb-4">
        <h2 className="text-2xl font-bold mb-1">{metadata.title}</h2>
        <p className="text-sm font-mono text-slate-500">
          {typeLabel} · {metadata.date}
          {metadata.liveUrl && (
            <>
              {' · '}
              <a
                href={metadata.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View site
              </a>
            </>
          )}
          {metadata.githubUrl && (
            <>
              {' · '}
              <a
                href={metadata.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                GitHub
              </a>
            </>
          )}
        </p>
        {metadata.role && metadata.organization && (
          <p className="text-sm text-slate-500">
            {metadata.role} at {metadata.organization}
          </p>
        )}
      </header>

      <div className="prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />

      {metadata.stack && metadata.stack.length > 0 && (
        <p className="not-prose text-sm font-mono text-slate-500 mt-4">
          <strong>Stack:</strong> {metadata.stack.join(', ')}
        </p>
      )}

      {metadata.recordSlug && (
        <p className="not-prose mt-4">
          <Link href={`/records/${metadata.recordSlug}`} prefetch={false} className="underline">
            Read the full case study &rarr;
          </Link>
        </p>
      )}
    </section>
  );
}

export default async function WorkPage() {
  const items = getAllWorkItems();

  const itemsWithHtml = await Promise.all(
    items.map(async (item) => {
      const { contentHtml } = await convertMarkdown(item.content);
      return { metadata: item.metadata, contentHtml };
    })
  );

  return (
    <main className="fade-in">
      <h1 className="text-3xl font-bold mb-2">Work</h1>
      <p className="text-lg mb-12">
        I build performant, maintainable, and thoughtful web systems. Here&rsquo;s a closer look at some of the work I&rsquo;ve done.
      </p>

      {itemsWithHtml.map((item, index) => (
        <div key={item.metadata.slug}>
          {index > 0 && <hr className="mb-16 border-gray-200" />}
          <WorkEntry
            metadata={item.metadata}
            contentHtml={item.contentHtml}
          />
        </div>
      ))}
    </main>
  );
}
