import Link from "next/link";
import { KcaCrest } from "@/components/brand/KcaCrest";
import { landingStatusMessage } from "@/lib/permissions";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome to the KCA Elections" };

export default async function LandingPage() {
  const store = await readStore();
  const status = landingStatusMessage(store.election.stage, store.election.year);

  return (
    <main className="landing-mesh relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-cream">
      <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-gold/25 md:inset-10" />
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <KcaCrest className="h-28 w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.28)] md:h-32" />

        <p className="mt-8 font-serif text-sm font-semibold tracking-[0.42em] text-gold uppercase">
          KCA University
        </p>
        <h1 className="mt-3 whitespace-nowrap font-serif text-[clamp(1.4rem,5vw,3rem)] leading-none font-semibold tracking-[0.16em] text-white uppercase">
          SAKU Election System
        </h1>

        <div className="gold-rule mt-8 w-48" />

        <p className="mt-8 text-lg font-medium text-cream/90 md:text-xl">
          Welcome to the KCA Elections
        </p>
        <p className="mt-3 max-w-md text-sm leading-6 tracking-wide text-gold/90 md:text-base">
          {status}
        </p>

        <Link
          href="/commission/login"
          className="mt-10 inline-flex min-w-[260px] items-center justify-center rounded-sm bg-gold px-8 py-3.5 text-sm font-bold tracking-[0.22em] text-navy uppercase transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          Commission Login
        </Link>

        <p className="mt-10 text-[11px] tracking-[0.34em] text-cream/55 uppercase">
          Secure · Transparent · Accessible
        </p>
      </div>
    </main>
  );
}
