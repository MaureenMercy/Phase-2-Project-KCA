import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function NotFound() {
  return (
    <main className="landing-mesh flex min-h-screen flex-col items-center justify-center px-6 text-center text-cream">
      <BrandLogo className="mb-8 h-28 w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]" />
      <p className="font-serif text-5xl text-gold">404</p>
      <p className="mt-3 text-sm tracking-[0.2em] uppercase">Page not found</p>
      <Link href="/" className="mt-8 text-gold underline-offset-4 hover:underline">
        Return to SAKU Election System
      </Link>
    </main>
  );
}
