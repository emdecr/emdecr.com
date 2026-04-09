import Link from "next/link";

export default function NotFound() {
  return (
    <main className="fade-in prose py-16">
      <h1 className="text-2xl font-semibold">404</h1>
      <p>This page doesn&rsquo;t exist.</p>
      <p>
        <Link href="/" prefetch={false} className="underline">
          Go back home
        </Link>
      </p>
    </main>
  );
}
