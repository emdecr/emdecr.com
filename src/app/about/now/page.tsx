import type { Metadata } from 'next'
import Image from 'next/image';
import { getBookCsvRowByBookId } from '@/lib/book-csv';
import type { BookCsvRow } from '@/lib/book-csv';
import { currentBookId } from '@/lib/config';
import { getLatestGitHubActivity } from '@/lib/github';
import { getLatestTrack } from '@/lib/music-rotation';


export const metadata: Metadata = {
    title: 'Emily Dela Cruz - About',
    description: 'Developer exploring opportunities at the intersection of technology, connection, and social change.',
}


export default async function NowPage() {
    const book: BookCsvRow | undefined = getBookCsvRowByBookId(currentBookId);
    const activity = await getLatestGitHubActivity();
    const track = getLatestTrack();

    return (
        <main className="prose">
            <h1>Now</h1>

            <p>This is what I&lsquo;m up to lately.</p>

            <h2>Latest GitHub Activity</h2>

            {activity ? (
                <div>
                    <p>
                        <a href={activity.link} target="_blank" rel="noopener noreferrer">
                            {activity.title}
                        </a>
                    </p>
                    {activity.commitMessage && (
                        <p>
                            <em>“{activity.commitMessage}”</em>
                        </p>
                    )}
                    <p><small>{new Date(activity.date).toLocaleDateString()}</small></p>
                </div>
            ) : (
                <p>No recent activity found.</p>
            )}

            {track && (
                <section>
                    <h2>🎧 Currently Listening</h2>
                    <p><strong>{track.title}</strong> by {track.artist}</p>
                    <p>Album: {track.album}</p>
                    {track.link && (
                        <p><a href={track.link} target="_blank" rel="noopener noreferrer">Listen</a></p>
                    )}
                    {track.image && (
                        <Image
                            src={track.image}
                            alt={`Album art for ${track.album}`}
                            width={200}
                            height={200} // required unless layout="fill"
                            className="rounded-lg"
                        />
                    )}
                </section>
            )}

            {book && (
                <section>
                    <h2>Currently Reading</h2>
                    <p><strong>{book.read_title}</strong></p>
                    <p>
                        <strong>Author(s):</strong>{' '}
                        {book.read_authors
                            .split(';')
                            .map((name) => name.trim())
                            .join(', ')}
                    </p>

                    <p><strong>Started</strong>: {book.read_date}</p>
                    <p><strong>Publisher</strong>: {book.read_publisher}</p>
                </section>
            )}

            {!book && <p>No current book found.</p>}
        </main>
    );
}

