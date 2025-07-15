import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export type MusicRotationRow = {
  ID: string;
  date_added: string;
  song_title: string;
  song_artist: string;
  song_album: string;
  song_link?: string;
  song_image?: string;
};

export type Track = {
  id: number;
  dateAdded: string;
  title: string;
  artist: string;
  album: string;
  link?: string;
  image?: string;
};

const csvPath = path.join(process.cwd(), 'data/music-rotation.csv');

export function getAllTracks(): Track[] {
  const file = fs.readFileSync(csvPath, 'utf-8');

  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
  }) as MusicRotationRow[];

  return records.map((row) => ({
    id: parseInt(row.ID, 10),
    dateAdded: row.date_added,
    title: row.song_title,
    artist: row.song_artist,
    album: row.song_album,
    link: row.song_link,
    image: row.song_image,
  }));
}

export function getLatestTrack(): Track | undefined {
  const tracks = getAllTracks();

  return tracks.reduce((latest, current) =>
    current.id > (latest?.id ?? -1) ? current : latest,
    undefined as Track | undefined
  );
}
