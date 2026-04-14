/**
 * Root layout for the (admin) route group.
 *
 * Route groups in Next.js (parenthesized folder names like "(admin)")
 * don't affect the URL — /ctrl still works as before. But they CAN
 * have their own root layout, which completely replaces the site's
 * root layout (the one with GlobalNav, footer, and analytics).
 *
 * This means admin pages get:
 *   - The same fonts (Geist)
 *   - No GlobalNav, no footer, no Cabin analytics script
 *   - A clean standalone shell for the admin UI
 */

import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
