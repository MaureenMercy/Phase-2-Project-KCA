import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DemoBanner } from "@/components/candidate/DemoBanner";
import { readCandidateSession } from "@/lib/candidate-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome" };

export default async function CandidateLandingPage() {
  const session = await readCandidateSession();
  const signedIn = session?.state === "authenticated";

  return (
    <div className="candidate-portal min-h-screen">
      <DemoBanner />
      <main className="mx-auto flex min-h-[calc(100vh-48px)] max-w-3xl flex-col justify-center px-6 py-16">
        <BrandLogo className="h-20 w-auto" surface="light" />
        <p className="mt-8 text-[11px] font-semibold tracking-[0.28em] text-navy/50 uppercase">
          candidate.kca.ac.ke
        </p>
        <h1 className="mt-3 font-serif text-4xl text-navy md:text-5xl">ORBIS Candidate Portal</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-navy/75">
          Apply to contest Election 1 (Delegates) or Election 2 (SAKU Council). Sending an application
          is not the same as being approved, and approval does not place you on a ballot.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={signedIn ? "/candidate/dashboard" : "/candidate/verify"}
            className="rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white"
          >
            {signedIn ? "Go to dashboard" : "Start identity verification"}
          </Link>
          <Link
            href="/candidate/help"
            className="rounded-xl border border-navy px-6 py-3 text-sm font-semibold text-navy"
          >
            Help &amp; support
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 text-sm text-navy/75 sm:grid-cols-3">
          <li className="candidate-card p-4">Short guided steps, not one long form.</li>
          <li className="candidate-card p-4">Save a draft and continue later.</li>
          <li className="candidate-card p-4">Track submitted, reviewed, approved or rejected.</li>
        </ul>
        <p className="mt-8 text-sm text-navy/55">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to SAKU Election System
          </Link>
          <span className="mx-2">·</span>
          <Link href="/candidate/home" className="underline-offset-4 hover:underline">
            Ballot appearance check
          </Link>
        </p>
      </main>
    </div>
  );
}
