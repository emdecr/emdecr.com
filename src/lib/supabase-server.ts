/**
 * supabase-server.ts — Authenticated Supabase client for server-side use.
 *
 * The existing client in data-source.ts uses the anon key for public reads.
 * This file creates clients that carry the user's auth token (from cookies),
 * so Supabase RLS policies can gate writes to authenticated users only.
 *
 * Uses @supabase/ssr which handles reading/writing auth tokens from
 * Next.js cookies automatically — no manual token management needed.
 *
 * Two exports:
 *  - createServerSupabaseClient(cookieStore) — for server components & server actions
 *  - createMiddlewareSupabaseClient(req, res) — for Next.js middleware
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ─── For Server Components & Server Actions ──────────────────────────────────
// Call this inside server actions, route handlers, and server components.
// It reads the auth cookie so Supabase knows who the user is.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        // getAll returns all cookies — @supabase/ssr picks out the ones it needs
        getAll() {
          return cookieStore.getAll();
        },
        // setAll writes updated auth tokens back to the browser
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can throw in server components (read-only context).
            // That's fine — the middleware handles token refresh instead.
          }
        },
      },
    }
  );
}

// ─── For Middleware ───────────────────────────────────────────────────────────
// Middleware can't use the cookies() API directly. Instead, it reads cookies
// from the request and writes updated cookies to the response.
// This is the standard pattern from the Supabase SSR docs.
export function createMiddlewareSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request (for downstream middleware/pages)
          // and the response (so the browser stores them)
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
