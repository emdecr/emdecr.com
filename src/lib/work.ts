import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const workDirectory = path.join(process.cwd(), 'content/work');

export interface WorkMetadata {
  title: string;
  slug: string;
  date: string;
  type: 'role' | 'side-project' | 'research' | 'personal-project';
  organization?: string;
  role?: string;
  summary?: string;
  stack?: string[];
  liveUrl?: string;
  githubUrl?: string;
  recordSlug?: string;
  order: number;
  status?: 'published' | 'draft';
}

export interface WorkItem {
  slug: string;
  content: string;
  metadata: WorkMetadata;
  filePath: string;
}

/**
 * Get all work items, sorted by order (ascending).
 * Only returns items with status 'published' or no status.
 */
export function getAllWorkItems(): WorkItem[] {
  const files = fs.readdirSync(workDirectory).filter((f) => f.endsWith('.md'));

  return files
    .map((file) => {
      const filePath = path.join(workDirectory, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      const metadata = data as WorkMetadata;

      if (!metadata.slug) {
        throw new Error(`Missing 'slug' in frontmatter: ${filePath}`);
      }

      return {
        slug: metadata.slug,
        content,
        metadata,
        filePath,
      };
    })
    .filter((item) => {
      const status = item.metadata.status;
      return !status || status === 'published';
    })
    .sort((a, b) => a.metadata.order - b.metadata.order);
}
