import Link from "next/link";
import { KcaCrest } from "@/components/brand/KcaCrest";

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
        <Link href="/" className="inline-flex flex-col items-center">
          <KcaCrest className="h-16 w-auto" />
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
