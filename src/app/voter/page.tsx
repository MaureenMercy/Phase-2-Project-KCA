import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DemoBanner } from "@/components/commission/DemoBanner";
import { LandingAuth } from "@/components/voter/LandingAuth";
import { mockNationalId } from "@/lib/identity";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Voter Portal" };

const DEMO_ACCOUNTS = [
  { id: "24/01204", note: "New registration (George Mwangi Njoroge)" },
  { id: "24/01211", note: "Approved eligible elector · visual assistance" },
  { id: "24/01301", note: "Pending verification" },
  { id: "24/01401", note: "Requires correction" },
  { id: "24/02101", note: "Approved · Election 1 vote already cast" },
  { id: "24/03401", note: "Rejected" },
  { id: "24/03301", note: "Verified, not yet an eligible elector" },
  { id: "24/04302", note: "Combined accessibility preferences" },
  { id: "24/03101", note: "Simulated Election 2 eligible delegate" },
  { id: "24/01201", note: "Simulated not elected for Election 2" },
  { id: "24/01202", note: "Simulated pending confirmation" },
  { id: "24/04101", note: "Simulated under review" },
  { id: "24/01901", note: "Electoral unit pending configuration" },
  { id: "24/01313", note: "Incomplete draft — continue later" },
];

export default async function VoterLandingPage() {
  const store = await readStore();
  void store;

  return (
    <main className="min-h-screen bg-cream text-navy">
      <DemoBanner />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <BrandLogo surface="light" className="h-20 w-auto" />
          <p className="mt-6 text-[11px] tracking-[0.28em] text-navy/40 uppercase">voter.kca.ac.ke</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">ORBIS Voter Portal</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-navy/70">
            Register, check your voter information, and see which election you may take part in.
            This is your student account for the SAKU elections — not the Election Day ballot.
          </p>
          <ul className="mt-6 space-y-2 text-sm leading-6 text-navy/75">
            <li>Register with your student record and a simulated phone code.</li>
            <li>See your campus polling station. Voting is on authorized campus computers.</li>
            <li>Election 2 is only for delegates on the approved Electoral College Register.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/voter/register"
              className="inline-flex min-h-11 items-center rounded-sm bg-gold px-6 py-3 text-xs font-bold tracking-[0.18em] text-navy uppercase"
            >
              Start voter registration
            </Link>
            <Link
              href="/voter/help"
              className="inline-flex min-h-11 items-center rounded-sm border border-navy/20 px-6 py-3 text-xs font-bold tracking-[0.18em] text-navy uppercase"
            >
              Help & support
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl">Sign in</h2>
          <p className="mt-1 text-sm text-navy/60">Use a seeded student ID and PIN SAKU2026. If you do not have a voter account yet, registration will start.</p>
          <div className="mt-5">
            <LandingAuth />
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-serif text-2xl">DEMO MODE accounts</h2>
        <p className="mt-2 text-sm text-navy/60">
          National ID for every seeded student is <span className="font-mono">3</span> plus the digits of the student ID.
          Example: 24/01204 uses {mockNationalId("24/01204")}. Unknown IDs such as 24/99999 go to support without creating a duplicate record.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-navy text-cream">
              <tr>
                <th className="px-4 py-3 font-semibold">Student ID</th>
                <th className="px-4 py-3 font-semibold">National ID (demo)</th>
                <th className="px-4 py-3 font-semibold">What you will see</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ACCOUNTS.map((item) => (
                <tr key={item.id} className="border-t border-navy/10">
                  <td className="px-4 py-3 font-mono">{item.id}</td>
                  <td className="px-4 py-3 font-mono">{mockNationalId(item.id)}</td>
                  <td className="px-4 py-3 text-navy/75">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
