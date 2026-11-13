import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DemoModeBanner } from "@/components/agent/StatusBadge";
import { AGENT_DEMO_CASES, AGENT_PORTAL_HOST } from "@/lib/agent-demo";

export const metadata = { title: "Election Agent Portal" };

export default function AgentLandingPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fa] text-navy">
      <DemoModeBanner />
      <div className="bg-navy px-6 py-16 text-cream">
        <div className="mx-auto max-w-4xl text-center">
          <BrandLogo className="mx-auto h-24 w-auto" priority />
          <p className="mt-6 text-[11px] tracking-[0.28em] text-gold uppercase">ORBIS · SAKU Election Platform</p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl">Election Agent Portal</h1>
          <p className="mt-2 text-sm tracking-[0.18em] text-gold/80 uppercase">{AGENT_PORTAL_HOST}</p>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-cream/75">
            For students nominated by an approved SAKU Council candidate. You cannot choose a candidate from a public list.
            A nomination is not accreditation. The Electoral Commission decides access.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/agent/register" className="rounded-xl bg-gold px-6 py-3 text-xs font-bold tracking-[0.18em] text-navy uppercase">
              Register with invitation
            </Link>
            <Link href="/agent/login" className="rounded-xl border border-gold/40 px-6 py-3 text-xs font-bold tracking-[0.18em] text-gold uppercase">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl">How nomination works</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-navy/70 md:grid-cols-2">
            <li>1. An approved Council candidate invites you from the Candidate Portal.</li>
            <li>2. You receive a nomination/invitation reference.</li>
            <li>3. You verify your student identity and submit an application.</li>
            <li>4. The Commission reviews identity and nomination, then accredits or declines.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl">Demo accounts and invitations</h2>
          <p className="mt-2 text-sm text-navy/60">
            Use the mock National ID and phone shown here. OTP is simulated. Do not connect live university systems.
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {AGENT_DEMO_CASES.map((item) => (
              <li key={`${item.label}-${item.studentId}`} className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">{item.label}</p>
                <p className="mt-1 font-semibold">{item.name}</p>
                <p className="font-mono text-xs">{item.studentId} · {item.invitation}</p>
                <p className="font-mono text-xs">ID {item.nationalId} · {item.phone}</p>
                <p className="mt-2 text-navy/60">{item.notes}</p>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-center text-xs text-navy/40">
          <Link href="/" className="underline">Back to ORBIS</Link>
        </p>
      </div>
    </main>
  );
}
