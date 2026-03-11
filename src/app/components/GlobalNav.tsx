// app/components/GlobalNav.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/records', label: 'Records' },
];

const GlobalNav = () => {
  const pathname = usePathname();

  return (
    <nav className="nav font-mono p-4 mt-4 mb-8" aria-label="Main navigation">
      <ul className="flex flex-wrap gap-12 text-sm">
        {navItems.map(({ href, label }) => {
          const isCurrent = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className="hover:underline"
                aria-current={isCurrent ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default GlobalNav;
