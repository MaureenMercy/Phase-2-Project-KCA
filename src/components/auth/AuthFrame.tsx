import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="landing-mesh flex min-h-screen items-center justify-center px-4 py-12">
      <div className="panel-shadow w-full max-w-md rounded-sm border border-gold/25 bg-navy/90 px-8 py-10 text-center backdrop-blur-sm">
        <Link
          href="/"
          className="inline-flex items-center justify-center transition hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          aria-label="KCA University home"
        >
          <BrandLogo className="h-32 w-auto rounded-sm drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]" priority />
        </Link>
        <p className="mt-5 font-serif text-[11px] tracking-[0.38em] text-gold uppercase">
          SAKU Election System
        </p>
        <h1 className="mt-3 font-serif text-3xl text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-cream/70">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
