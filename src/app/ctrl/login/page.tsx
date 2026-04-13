/**
 * /ctrl/login — Admin login page.
 *
 * A simple email + password form. Uses React 19's useActionState to call
 * the login server action and display errors inline (no page reload needed).
 *
 * The middleware redirects here if you try to access /ctrl/* without a session,
 * and redirects away from here if you're already logged in.
 */
'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  // useActionState hooks up a server action to form state.
  // - `error` is the return value from the action (null on success, string on failure)
  // - `formAction` is what we pass to the form's action prop
  // - `isPending` is true while the action is running (for loading states)
  const [error, formAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-bold mb-6">Log in</h1>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Show error message from the server action */}
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white rounded px-3 py-2 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
