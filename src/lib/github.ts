import Parser from 'rss-parser';

export type GitHubActivity = {
  title: string;
  link: string;
  date: string;
};

export async function getLatestGitHubActivity(limit = 5): Promise<GitHubActivity[]> {
  const parser = new Parser();
  const feed = await parser.parseURL('https://github.com/emdecr.atom');

  return feed.items.slice(0, limit).map((item) => ({
    title: item.title || '',
    link: item.link || '',
    date: item.pubDate || '',
  }));
}
