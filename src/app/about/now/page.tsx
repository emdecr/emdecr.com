import type { Metadata } from 'next'
import { getBookCsvRowByBookId } from '@/lib/book-csv';
import type { BookCsvRow } from '@/lib/book-csv';
import { currentBookId } from '@/lib/config';
import { getLatestGitHubActivity } from '@/lib/github';

export const metadata: Metadata = {
    title: 'Emily Dela Cruz - About',
    description: 'Developer exploring opportunities at the intersection of technology, connection, and social change.',
}


export default async function NowPage() {
    const book: BookCsvRow | undefined = getBookCsvRowByBookId(currentBookId);
    const activity = await getLatestGitHubActivity();

    return (
        <main className="prose">
            <h1>Now</h1>

            <p>This is what I&lsquo;m up to lately.</p>

            <h2>Latest GitHub Activity</h2>
            <ul>
                {activity.map((item, index) => (
                    <li key={index}>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            {item.title}
                        </a>{' '}
                        <small>{new Date(item.date).toLocaleDateString()}</small>
                    </li>
                ))}
            </ul>

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

