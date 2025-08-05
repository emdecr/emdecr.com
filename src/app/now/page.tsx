import type { Metadata } from 'next'
import Image from 'next/image';
import Link from "next/link";
import { getBookCsvRowByBookId } from '@/lib/book-csv';
import type { BookCsvRow } from '@/lib/book-csv';
import { currentBookId } from '@/lib/config';
import { getLatestGitHubActivity } from '@/lib/github';
import { getLatestTrack } from '@/lib/music-rotation';
import { getMarkdownContent } from '@/lib/markdown';
import { getLatestBookmark } from "@/lib/bookmarks";


export const metadata: Metadata = {
    title: 'Emily Dela Cruz - Now',
    description: 'Developer exploring opportunities at the intersection of technology and social change.',
}


export default async function NowPage() {
    const book: BookCsvRow | undefined = getBookCsvRowByBookId(currentBookId);
    const activity = await getLatestGitHubActivity();
    const latestBookmark = await getLatestBookmark();
    const track = getLatestTrack();
    const { contentHtml } = await getMarkdownContent('now.md');

    return (
        <main className="fade-in">
            <h1 className="text-3xl font-bold mb-4">Now</h1>

            <div className="lg:grid gap-12 grid-cols-5">
                <article className="prose col-span-3" dangerouslySetInnerHTML={{ __html: contentHtml }}></article>
                <aside className="col-span-2">
                    {track && (
                        <section className="mb-6">
                            <h2 className="text-2xl font-bold mb-2"> Listening</h2>
                            {track.image && (
                                <Image
                                    src={track.image}
                                    alt={`Album art for ${track.album}`}
                                    width={150}
                                    height={150} // required unless layout="fill"
                                    className="border border-solid border-slate-200 mb-2"
                                />
                            )}
                            <p className="text-lg font-bold">{track.title} by {track.artist}</p>
                            <p><strong>Release</strong>: {track.album}</p>
                            {track.link && (
                                <p><a href={track.link} target="_blank" rel="noopener noreferrer" className="
                                underline">Listen</a></p>
                            )}
                        </section>
                    )}

                    {book && (
                        <section className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">Reading</h2>
                            {book.read_image && (
                                <Image
                                    src={book.read_image}
                                    alt={`Album art for ${book.read_title}`}
                                    width={150}
                                    height={150} // required unless layout="fill"
                                    className="border border-solid border-slate-200 mb-2"
                                />
                            )}
                            <p className="text-lg font-bold">{book.read_title}</p>
                            <p>
                                <strong>Author(s):</strong>{' '}
                                {book.read_authors
                                    .split(';')
                                    .map((name) => name.trim())
                                    .join(', ')}
                            </p>
                        </section>
                    )}

                    {!book && <p>No current book found.</p>}

                    {latestBookmark && (
                        <section className="mb-6">
                            <h2 className="text-2xl font-bold mb-2"> Bookmarked</h2>
                            <p className="text-sm text-gray-500">
                                {new Date(latestBookmark.bookmark_date).toLocaleDateString()}
                            </p>
                            <Link
                                href={latestBookmark.bookmark_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                {latestBookmark.bookmark_title}
                            </Link>
                        </section>
                    )}

                    {activity ? (
                        <section className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">GitHub Activity</h2>
                            <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                            <p>
                                <a href={activity.link} target="_blank" rel="noopener noreferrer">
                                    {activity.title}
                                </a>
                            </p>
                            {activity.commitMessage && (
                                <p className="font-mono">
                                    <em>“{activity.commitMessage}”</em>
                                </p>
                            )}
                        </section>
                    ) : (
                        <p>No recent activity found.</p>
                    )}
                </aside>
            </div>

        </main>
    );
}

