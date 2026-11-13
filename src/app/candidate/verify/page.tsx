import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DemoBanner } from "@/components/candidate/DemoBanner";
import { IdentityForm } from "@/components/candidate/IdentityForm";
import { readCandidateSession } from "@/lib/candidate-session";
import { DEMO_CANDIDATE_ACCOUNTS } from "@/lib/seed";
import { readStore } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify your identity" };

export default async function CandidateVerifyPage() {
  const session = await readCandidateSession();
  if (session?.state === "authenticated") redirect("/candidate/dashboard");
  if (session?.state === "pending_otp") redirect("/candidate/verify/otp");
  const store = await readStore();

  return (
    <div className="candidate-portal min-h-screen">
      <DemoBanner />
      <main className="mx-auto max-w-xl px-6 py-12">
        <Link href="/candidate" className="inline-flex items-center gap-3">
          <BrandLogo className="h-14 w-auto" surface="light" />
          <span className="font-serif text-2xl text-navy">Candidate Portal</span>
        </Link>
        <h1 className="mt-8 font-serif text-3xl text-navy">Confirm who you are</h1>
        <p className="mt-3 text-sm leading-6 text-navy/70">
          Enter your student registration number, National ID and mobile number. We will match them
          to the mock student register, then send a simulated one-time code. Verified academic
          details cannot be changed on this portal.
        </p>
        <div className="candidate-card mt-8 p-6">
          <IdentityForm
            documentTypes={store.portalConfig.identityDocumentTypes}
            alternativePolicyPending={store.portalConfig.alternativeIdPolicyStatus === "awaiting_commission"}
            demoAccounts={DEMO_CANDIDATE_ACCOUNTS}
          />
        </div>
      </main>
    </div>
  );
}
