/**
 * Login/logout server actions.
 *
 * Server actions run on the server and can set cookies, which is exactly
 * what we need for Supabase auth. The flow:
 *
 *   1. User submits email + password on the login form
 *   2. This action calls Supabase's signInWithPassword()
 *   3. @supabase/ssr automatically writes the auth token to a cookie
 *   4. We redirect to /ctrl — the middleware sees the cookie and lets them in
 *
 * "use server" marks this entire file as server-only code.
 */
'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── Login ───────────────────────────────────────────────────────────────────
// Returns an error message string on failure, or redirects on success.
// This signature works with useActionState() on the client side.
export async function login(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Basic validation — shouldn't happen with required fields, but just in case
  if (!email || !password) {
    return 'Email and password are required.';
  }

  const supabase = await createServerSupabaseClient();

  // signInWithPassword returns an error object (not a thrown exception)
  // if the credentials are wrong
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Return the error message to display on the form.
    // Common errors: "Invalid login credentials", "Email not confirmed"
    return error.message;
  }

  // Success — redirect to the admin dashboard.
  // redirect() throws internally (it's how Next.js handles redirects in
  // server actions), so nothing after this line executes.
  redirect('/ctrl');
}

// ─── Logout ──────────────────────────────────────────────────────────────────
// Called from the admin layout's logout button.
export async function logout() {
  const supabase = await createServerSupabaseClient();

  // signOut clears the session on Supabase's end and @supabase/ssr
  // removes the auth cookie
  await supabase.auth.signOut();

  redirect('/ctrl/login');
}
