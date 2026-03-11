import fs from 'fs';
import path from 'path';
import { ComponentType } from 'react';

const bespokeDirectory = path.join(process.cwd(), 'src/app/records/bespoke');

export interface BespokeRecordMeta {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  categories?: string[];
  status?: 'published' | 'draft' | 'hidden';
}

/**
 * Extract metadata from a bespoke component file by reading it as text.
 * Parses the `export const metadata = { ... }` block via regex.
 */
function extractMetadataFromFile(
  filePath: string,
): Omit<BespokeRecordMeta, 'slug'> | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(
    /export\s+const\s+metadata\s*=\s*\{([\s\S]*?)\};/,
  );
  if (!match) return null;

  const body = match[1];
  const result: Record<string, unknown> = {};

  // Match array values like: categories: ['a', 'b']
  const arrayRegex = /(\w+)\s*:\s*\[([^\]]*)\]/g;
  let arrMatch;
  while ((arrMatch = arrayRegex.exec(body)) !== null) {
    const items = arrMatch[2].match(/['"]([^'"]*)['"]/g);
    result[arrMatch[1]] = items ? items.map((s) => s.replace(/['"]/g, '')) : [];
  }

  // Match string values (skip keys already matched as arrays)
  const pairRegex = /(\w+)\s*:\s*['"]([^'"]*)['"]/g;
  let m;
  while ((m = pairRegex.exec(body)) !== null) {
    if (!(m[1] in result)) {
      result[m[1]] = m[2];
    }
  }

  return result as unknown as Omit<BespokeRecordMeta, 'slug'>;
}

/**
 * Scans the bespoke directory and returns metadata from all .tsx files.
 * Filters out draft/hidden records (same behavior as markdown getAllRecords).
 */
export function getAllBespokeRecords(): BespokeRecordMeta[] {
  if (!fs.existsSync(bespokeDirectory)) return [];

  const files = fs
    .readdirSync(bespokeDirectory)
    .filter((f) => f.endsWith('.tsx'));

  return files
    .map((file) => {
      const slug = file.replace(/\.tsx$/, '');
      const filePath = path.join(bespokeDirectory, file);
      const meta = extractMetadataFromFile(filePath);
      if (!meta) return null;
      return { slug, ...meta };
    })
    .filter((record): record is BespokeRecordMeta => {
      if (!record) return false;
      const status = record.status;
      return !status || status === 'published';
    });
}

/**
 * Get metadata for a single bespoke record by slug.
 * Does NOT filter by status — drafts are still visitable by direct URL.
 */
export function getBespokeRecord(
  slug: string,
): BespokeRecordMeta | undefined {
  const filePath = path.join(bespokeDirectory, `${slug}.tsx`);
  if (!fs.existsSync(filePath)) return undefined;

  const meta = extractMetadataFromFile(filePath);
  if (!meta) return undefined;
  return { slug, ...meta };
}

/**
 * Dynamically import and return the default component for a bespoke slug.
 * Uses aliased import path so webpack can create a context module.
 */
export async function getBespokeComponent(
  slug: string,
): Promise<ComponentType | undefined> {
  const filePath = path.join(bespokeDirectory, `${slug}.tsx`);
  if (!fs.existsSync(filePath)) return undefined;

  const mod = await import(`@/app/records/bespoke/${slug}`);
  return mod.default;
}
