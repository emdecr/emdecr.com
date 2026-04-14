/**
 * POST /api/upload-image — Upload and compress book cover images.
 *
 * Flow:
 *   1. Verify the user is authenticated (check JWT from cookie)
 *   2. Read the uploaded file from multipart form data
 *   3. Compress to WebP at 80% quality using sharp
 *   4. Write to the CDN directory on disk (same Linode server)
 *   5. Return the public CDN URL
 *
 * Why a Route Handler instead of a Server Action?
 *   Server actions have payload size limits and multipart binary handling
 *   is more straightforward in a route handler. The book form's server
 *   action will call this endpoint internally via fetch().
 *
 * Required env vars:
 *   ADMIN_CDN_DIR        — absolute filesystem path, e.g. /var/www/cdn/images/books
 *   ADMIN_CDN_URL_PREFIX — public URL prefix, e.g. https://cdn.emilydelacruz.com/images/books
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  // ── 1. Auth check ────────────────────────────────────────────────────────
  // Anyone can hit this endpoint, so we need to verify the request
  // comes from an authenticated user. Same pattern as the middleware.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ── 2. Check env vars ───────────────────────────────────────────────────
  const cdnDir = process.env.ADMIN_CDN_DIR;
  const cdnUrlPrefix = process.env.ADMIN_CDN_URL_PREFIX;

  if (!cdnDir || !cdnUrlPrefix) {
    return NextResponse.json(
      { error: 'Server misconfigured: ADMIN_CDN_DIR and ADMIN_CDN_URL_PREFIX must be set.' },
      { status: 500 }
    );
  }

  // ── 3. Parse the uploaded file ──────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invalid form data.' },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: 'No file provided. Send a "file" field in multipart form data.' },
      { status: 400 }
    );
  }

  // Basic validation — only accept image types
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}. Only images are accepted.` },
      { status: 400 }
    );
  }

  // ── 4. Compress to WebP ─────────────────────────────────────────────────
  // Read the file into a buffer, then pass it through sharp.
  // sharp handles JPEG, PNG, WebP, AVIF, TIFF, GIF, and SVG inputs.
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  let outputBuffer: Buffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Image processing failed: ${message}` },
      { status: 500 }
    );
  }

  // ── 5. Generate filename and write to disk ──────────────────────────────
  // Use the original filename (without extension) + timestamp to avoid
  // collisions. Slugify it to be URL-safe.
  const baseName = file.name
    .replace(/\.[^.]+$/, '')     // strip extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dashes
    .replace(/^-|-$/g, '');       // trim leading/trailing dashes

  const timestamp = Date.now();
  const filename = `${baseName}-${timestamp}.webp`;
  const outputPath = path.join(cdnDir, filename);

  try {
    // Ensure the CDN directory exists (mkdir -p equivalent)
    await fs.mkdir(cdnDir, { recursive: true });
    await fs.writeFile(outputPath, outputBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to write file: ${message}` },
      { status: 500 }
    );
  }

  // ── 6. Return the public URL ────────────────────────────────────────────
  // The CDN URL prefix + filename gives the full public URL that gets
  // stored in the books table's read_image column.
  const publicUrl = `${cdnUrlPrefix}/${filename}`;

  return NextResponse.json({
    url: publicUrl,
    filename,
    // Include some stats for debugging / confirmation
    originalSize: inputBuffer.length,
    compressedSize: outputBuffer.length,
  });
}
