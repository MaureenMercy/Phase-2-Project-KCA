import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing-mesh flex min-h-screen flex-col items-center justify-center px-6 text-center text-cream">
      <p className="font-serif text-5xl text-gold">404</p>
      <p className="mt-3 text-sm tracking-[0.2em] uppercase">Page not found</p>
      <Link href="/" className="mt-8 text-gold underline-offset-4 hover:underline">
        Return to SAKU Election System
      </Link>
    </main>
  );
}
