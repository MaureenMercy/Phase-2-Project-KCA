import Link from "next/link";
import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Voting desks" };
export const dynamic = "force-dynamic";

export default async function DesksPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const voterOpen =
    store.election.stage === "VOTING" &&
    store.election.contest === "ELECTION_1_DELEGATE" &&
    store.election.emergencyStatus === "RUNNING";
  const electorOpen =
    store.electoralCollege.status === "active" && store.election.emergencyStatus === "RUNNING";
  const sample = store.studentElectors.find((student) => student.eligibilityStatus === "eligible");

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Setup guide" title="Voter desk and elector desk">
        Two different people sign in on two different desks. A commissioner can
        preview both looks now. Opening the live desks is a later Commission action.
        Signed in as {session.shortName}.
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-navy">Voter desk</h2>
            <StatusPill tone={voterOpen ? "ok" : "warn"}>{voterOpen ? "Open for sign-in" : "Not open yet"}</StatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-navy/70">
            This is the student portal for Election 1. A student signs in with a
            Student ID from the voter register and the demonstration PIN{" "}
            <code className="rounded bg-cream px-1">SAKU2026</code>.
            {sample ? (
              <>
                {" "}Example: <strong>{sample.fullName}</strong>, Student ID{" "}
                <code className="rounded bg-cream px-1">{sample.studentId}</code>.
              </>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-navy/70">
            Live address: <Link className="font-semibold underline" href="/elector">/elector</Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase" href="/preview/voter">
              Preview voter sign-in
            </Link>
            <Link className="rounded-sm border border-navy/15 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" href="/preview/voter/ballot">
              Preview voter ballot
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-navy">Elector desk</h2>
            <StatusPill tone={electorOpen ? "ok" : "warn"}>{electorOpen ? "Open for sign-in" : "Waiting for Election 1"}</StatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-navy/70">
            This is the electoral-college portal for the Cabinet election. It
            opens only after Election 1 results are finalized and the register is
            verified. An elector signs in with the registration number on that
            register, then an OTP issued on the desk.
          </p>
          <p className="mt-2 text-sm text-navy/70">
            Live address: <Link className="font-semibold underline" href="/vote">/vote</Link>
            {" · "}register status: {store.electoralCollege.status.replaceAll("_", " ")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase" href="/preview/elector">
              Preview elector sign-in
            </Link>
            <Link className="rounded-sm border border-navy/15 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" href="/preview/elector/ballot">
              Preview elector ballot
            </Link>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm leading-6 text-navy/75">
        <h2 className="font-serif text-2xl text-navy">1. Let a student sign in on the voter desk</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Chair or Vice Chair: open{" "}
            <Link className="font-semibold underline" href="/commission/election/election-1?tab=structure">
              Election → Electoral structure
            </Link>{" "}
            and allocate delegate seats. Type 2 and use “Allocate on all remaining units” if you are demonstrating.
          </li>
          <li>
            On the{" "}
            <Link className="font-semibold underline" href="/commission/dashboard">dashboard</Link>,
            click <strong>Authorize opening</strong> and enter the Chair or Vice Chair password again.
          </li>
          <li>The lifecycle pill must read Voting in progress. The voter desk status above then reads Open for sign-in.</li>
          <li>
            At the polling desk, open <Link className="font-semibold underline" href="/elector">/elector</Link>.
            Student ID from the register, PIN <code className="rounded bg-cream px-1">SAKU2026</code>.
            The ballot only lists candidates in that student’s own unit.
          </li>
        </ol>
        <p className="mt-3">
          A commissioner can preview the voter screens from the buttons above at any time.
          Preview does not open the election and does not store a vote.
        </p>
      </section>

      <section className="rounded-2xl border border-gold bg-white/90 p-6 text-sm leading-6 text-navy/75">
        <h2 className="font-serif text-2xl text-navy">2. Activate the elector desk after Election 1</h2>
        <p className="mt-3">
          Do this after students have voted, or after you apply demonstration tallies.
          The elector list is calculated from the winners. Nobody types electors in by hand.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Open{" "}
            <Link className="font-semibold underline" href="/commission/election/election-1?tab=results">
              Election 1 → Results
            </Link>
            . Click <strong>Apply demonstration tallies</strong>, then <strong>Finalize elected delegates</strong>.
          </li>
          <li>
            Open{" "}
            <Link className="font-semibold underline" href="/commission/election/election-1?tab=college">
              Electoral College Register
            </Link>
            . Click <strong>Generate register from results</strong>, then <strong>Verify and activate</strong>.
          </li>
          <li>
            The register status becomes <strong>active</strong>. The elector desk at{" "}
            <Link className="font-semibold underline" href="/vote">/vote</Link> then accepts sign-in.
          </li>
          <li>
            The elector uses the registration number shown on that register. On the desk they click{" "}
            <strong>Issue OTP</strong>, enter the code, and unlock the six-contest Cabinet ballot.
          </li>
        </ol>
        <p className="mt-3">
          Generating and verifying the register needs voter-register authority (Chair, Vice Chair, or Secretary General).
          A commissioner still previews the elector sign-in and ballot before that activation.
        </p>
      </section>
    </div>
  );
}
