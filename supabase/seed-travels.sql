-- Seed travel data with placeholder entries for development/testing.
-- Run this AFTER 002_travels.sql has created the table.
--
-- Replace these with real travel data in Supabase directly —
-- real data should NOT live in this public repo.

INSERT INTO travels (id, name, country, lat, lng, date, date_end, images, record_slug, note, status) VALUES
  ('london-2024',          'London',         'England',        51.5074,   -0.1278,  '2024-03-10', '2024-03-17', '[]'::jsonb, NULL, 'Test pin — London',    'visited'),
  ('paris-2023',           'Paris',          'France',         48.8566,    2.3522,  '2023-10-01', '2023-10-08', '[]'::jsonb, NULL, 'Test pin — Paris',     'visited'),
  ('tokyo-2023',           'Tokyo',          'Japan',          35.6762,  139.6503,  '2023-04-15', '2023-04-25', '[]'::jsonb, NULL, 'Test pin — Tokyo',     'visited'),
  ('new-york-2024',        'New York',       'United States',  40.7128,  -74.0060,  '2024-06-01', '2024-06-05', '[]'::jsonb, NULL, 'Test pin — NYC',       'visited'),
  ('new-york-2023',        'New York',       'United States',  40.7128,  -74.0060,  '2023-09-10', '2023-09-14', '[]'::jsonb, NULL, 'Test pin — NYC again', 'visited'),
  ('south-korea-wishlist', 'Seoul',          'South Korea',    37.5665,  126.9780,  '2025-01-01',  NULL,         '[]'::jsonb, NULL, NULL,                   'wishlist'),
  ('brazil-wishlist',      'Rio de Janeiro', 'Brazil',        -22.9068,  -43.1729,  '2025-01-01',  NULL,         '[]'::jsonb, NULL, NULL,                   'wishlist')
ON CONFLICT (id) DO NOTHING;
