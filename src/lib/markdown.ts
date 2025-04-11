import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const recordsPath = path.join(process.cwd(), 'content/records');

export type RecordData = {
  title: string;
  date: string;
  slug: string;
  summary?: string;
  contentHtml?: string;
};

export function getAllRecords(): RecordData[] {
  const files = fs.readdirSync(recordsPath);

  const records = files.map((filename) => {
    const slug = filename.replace(/\.md$/, '');
    const fullPath = path.join(recordsPath, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      ...(data as Omit<RecordData, 'slug'>),
    };
  });

  // Sort records by date in descending order
  return records.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    return dateB.getTime() - dateA.getTime(); // Descending order
  });
}

export async function getRecordBySlug(slug: string): Promise<RecordData> {
  const fullPath = path.join(recordsPath, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    ...(data as Omit<RecordData, 'slug' | 'contentHtml'>),
  };
}
