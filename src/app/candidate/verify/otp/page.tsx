import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DemoBanner } from "@/components/candidate/DemoBanner";
import { OtpForm } from "@/components/candidate/OtpForm";
import { getCandidateDemoOtp } from "@/lib/actions/candidate-portal";
import { requirePendingCandidateOtp } from "@/lib/candidate-session";
import { maskPhone } from "@/lib/identity";
import { identityByStudentId } from "@/lib/identity";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enter your code" };

export default async function CandidateOtpPage() {
  const session = await requirePendingCandidateOtp();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId);
  const demoOtp = await getCandidateDemoOtp();

  return (
    <div className="candidate-portal min-h-screen">
      <DemoBanner />
      <main className="mx-auto max-w-xl px-6 py-12">
        <Link href="/candidate" className="inline-flex items-center gap-3">
          <BrandLogo className="h-14 w-auto" surface="light" />
          <span className="font-serif text-2xl text-navy">Candidate Portal</span>
        </Link>
        <h1 className="mt-8 font-serif text-3xl text-navy">Enter your one-time code</h1>
        <p className="mt-3 text-sm leading-6 text-navy/70">
          A simulated code was issued for the mobile number ending{" "}
          {identity ? maskPhone(identity.phoneNumber).slice(-6) : "on your record"}. No real SMS is
          sent in this prototype.
        </p>
        <div className="candidate-card mt-8 p-6">
          <OtpForm demoOtp={demoOtp} />
        </div>
      </main>
    </div>
  );
}
