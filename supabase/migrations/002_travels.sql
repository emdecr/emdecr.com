-- Travels table: stores travel pin data for the /travels interactive map.
-- Matches the Travel type in src/lib/travels.ts.
--
-- Data source priority: Supabase first, /data/travels.json fallback.
-- RLS is enabled but defaults to public read access.
-- To gate pins behind login later, update the SELECT policy to require auth.

CREATE TABLE IF NOT EXISTS travels (
  id          text PRIMARY KEY,             -- Unique kebab-case identifier, e.g. "london-2024"
  name        text NOT NULL,                -- Display name: city, region, or area
  country     text NOT NULL,                -- Country or state name
  lat         double precision NOT NULL,    -- Latitude in decimal degrees (north is positive)
  lng         double precision NOT NULL,    -- Longitude in decimal degrees (east is positive)
  date        text NOT NULL,                -- Start date as partial ISO: "2024-03" or "2024-03-15"
  date_end    text,                         -- End date (same format), null for single dates
  images      jsonb DEFAULT '[]'::jsonb,    -- Array of image path strings, e.g. ["/images/travels/london-01.jpg"]
  record_slug text,                         -- Links to /records/[slug] article, null if no article
  note        text,                         -- Short one-line description for tooltip and card
  status      text NOT NULL DEFAULT 'visited', -- 'visited' = been there, 'wishlist' = want to go
  created_at  timestamptz DEFAULT now()     -- Row creation timestamp (for housekeeping)
);

COMMENT ON TABLE travels IS 'Travel locations displayed as pins on the /travels interactive map.';
COMMENT ON COLUMN travels.images IS 'JSONB array of image paths relative to /public, e.g. ["/images/travels/pic.jpg"]';
COMMENT ON COLUMN travels.record_slug IS 'Slug for a related /records/[slug] article. Null if no write-up exists.';
COMMENT ON COLUMN travels.status IS 'Pin type: visited (been there) or wishlist (want to go). Affects pin styling on the map.';

-- Enable Row Level Security.
-- Default policy: anyone can read all rows.
-- To restrict later: drop this policy and add one that checks auth.uid().
ALTER TABLE travels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON travels
  FOR SELECT
  USING (true);

-- Seed with test data (same entries as /data/travels.json) for calibration.
-- Delete these once real data is added.
INSERT INTO travels (id, name, country, lat, lng, date, date_end, images, record_slug, note, status) VALUES
  ('london-2024',   'London',   'England',       51.5074,   -0.1278,  '2024-03', '2024-04', '[]'::jsonb, NULL, 'Test pin — should land on southeast England', 'visited'),
  ('tokyo-2024',    'Tokyo',    'Japan',          35.6762,  139.6503,  '2024-10',  NULL,      '[]'::jsonb, NULL, 'Test pin — should land on Honshu island',     'wishlist'),
  ('new-york-2023', 'New York', 'United States',  40.7128,  -74.006,  '2023-06', '2023-06',  '[]'::jsonb, NULL, 'Test pin — should land on US northeast coast', 'visited')
ON CONFLICT (id) DO NOTHING;
