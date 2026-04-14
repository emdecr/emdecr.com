export const metadata = {
  title: 'Example Bespoke Record',
  date: '2026-03-02',
  summary: 'A placeholder bespoke record to verify the setup works.',
  status: 'draft' as const,
};

export default function ExampleBespoke() {
  return (
    <article className="prose">
      <h1>{metadata.title}</h1>
      <p>This is a bespoke record.</p>
    </article>
  );
}

