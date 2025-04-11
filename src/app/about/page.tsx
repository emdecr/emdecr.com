import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export default async function AboutPage() {
  const filePath = path.join(process.cwd(), 'content/pages/about.md');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { content } = matter(fileContent);
  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return (
    <main className="p-8">
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </main>
  );
}
