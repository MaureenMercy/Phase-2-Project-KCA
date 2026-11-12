import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DemoBanner } from "@/components/candidate/DemoBanner";
import { HelpContent } from "@/components/candidate/HelpContent";
import { readCandidateSession } from "@/lib/candidate-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help & support" };

export default async function PublicHelpPage() {
  const session = await readCandidateSession();
  const signedIn = session?.state === "authenticated";
  return (
    <div className="candidate-portal min-h-screen">
      <DemoBanner />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/candidate" className="inline-flex items-center gap-3">
            <BrandLogo className="h-12 w-auto" surface="light" />
            <span className="font-serif text-2xl text-navy">Candidate Portal</span>
          </Link>
          <Link
            href={signedIn ? "/candidate/dashboard" : "/candidate/verify"}
            className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </div>
        <HelpContent />
      </main>
    </div>
  );
}
