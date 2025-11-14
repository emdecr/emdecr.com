import Parser from 'rss-parser';
import { decode } from 'html-entities';

type GitHubFeedItem = {
  title: string;
  link: string;
  content: string; // contains escaped HTML
  pubDate: string;
};

const parser = new Parser<object, GitHubFeedItem>();

export async function getLatestGitHubActivity() {
  const feed = await parser.parseURL('https://github.com/emdecr.atom');

  const latest = feed.items[0];
  if (!latest) return null;

  const { title, link, content, pubDate } = latest;

  // Step 1: decode escaped HTML content
  const decoded = decode(content);

  // Step 2: extract commit message from <blockquote>...</blockquote>
  let commitMessage: string | null = null;
  const match = decoded.match(/<blockquote>([\s\S]*?)<\/blockquote>/);
  if (match) {
    commitMessage = match[1].trim();
  }

  return {
    title,             // e.g., "emdecr pushed to main in emdecr/emdecr.com"
    link,
    commitMessage,     // e.g., "Add /now scaffolding for currently reading"
    date: pubDate,
  };
}
