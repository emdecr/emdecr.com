import { getAllRecords, convertMarkdown } from '@/lib/records';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toUTCString();
}

export async function GET() {
  const records = getAllRecords();
  
  // Sort records by date (newest first)
  const sortedRecords = records.sort((a, b) => {
    const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
    const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
    return dateB - dateA;
  });

  // Get site URL from environment or use a default
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  
  // Generate RSS items
  const items = await Promise.all(
    sortedRecords.map(async (record) => {
      const { title, slug, date, summary } = record.metadata;
      const link = `${siteUrl}/records/${slug}`;
      const pubDate = date ? formatDate(date) : new Date().toUTCString();
      
      // Convert markdown to HTML for description
      const { contentHtml } = await convertMarkdown(record.content);
      // Strip HTML tags for plain text summary, or use the summary from frontmatter
      const description = summary || contentHtml.replace(/<[^>]*>/g, '').substring(0, 500);
      
      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
  );

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Emily Dela Cruz - Records</title>
    <link>${siteUrl}/records</link>
    <description>A collection of thoughts.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/records/feed.xml" rel="self" type="application/rss+xml"/>
${items.join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

