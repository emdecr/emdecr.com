/**
 * middleware.ts — Protects the /ctrl admin routes.
 *
 * How it works:
 * 1. Next.js runs this on every request matching the `config.matcher` pattern.
 * 2. We create a Supabase client that reads the auth cookie from the request.
 * 3. getUser() verifies the JWT with Supabase — this also refreshes the token
 *    if it's expired (important! without this, sessions silently break).
 * 4. If there's no valid user, redirect to the login page.
 * 5. If the user IS authenticated and visits /ctrl/login, redirect to /ctrl
 *    (no need to see the login page when already logged in).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareSupabaseClient } from '@/lib/supabase-server';

export async function middleware(request: NextRequest) {
  // Start with a plain "next" response — we'll modify its cookies if needed
  const response = NextResponse.next({ request });

  // Create a Supabase client that can read/write auth cookies
  const supabase = createMiddlewareSupabaseClient(request, response);

  // getUser() does two things:
  // 1. Validates the current session (returns the user or null)
  // 2. Refreshes the auth token if it's about to expire
  // IMPORTANT: Always call getUser(), not getSession() — getSession() doesn't
  // validate the JWT and can return stale data.
  const { data: { user } } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/ctrl/login';

  // Not logged in and trying to access a protected route → go to login
  if (!user && !isLoginPage) {
    const loginUrl = new URL('/ctrl/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in and visiting the login page → go to dashboard
  if (user && isLoginPage) {
    const dashboardUrl = new URL('/ctrl', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // All good — continue with the (possibly cookie-updated) response
  return response;
}

// Only run this middleware on /ctrl and its sub-routes.
// Everything else on the site is public and should not be affected.
export const config = {
  matcher: ['/ctrl/:path*'],
};
