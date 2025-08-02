// app/components/GlobalNav.tsx
import Link from 'next/link';

const GlobalNav = () => {
  return (
    <nav className="nav font-mono">
      <ul className="flex flex-wrap gap-6 text-sm pt-8">
        <li>
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li>
          <Link href="/about" className="hover:underline ">
            About
          </Link>
        </li>
        <li>
          <Link href="/records" className="hover:underline">
            Records
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default GlobalNav;
