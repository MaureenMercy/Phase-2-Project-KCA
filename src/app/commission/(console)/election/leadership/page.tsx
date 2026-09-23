import Link from "next/link";
import { ModuleSubnav, PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { CABINET_CONTESTS } from "@/lib/electoral";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "SAKU Leadership Election" };
export const dynamic = "force-dynamic";

export default async function LeadershipPage() {
  await requireAuthorizedSession();
  const store = await readStore();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Election 2" title="SAKU Leadership Election">
        Delegates elected in Election 1 become the only electors. There is no
        manual “add elector” workflow. Authentication is registration number + OTP.
        The ballot is sequential and the President/Vice President run as one ticket.
      </PageHeader>

      <ModuleSubnav
        current="/commission/election/leadership"
        items={[
          { href: "/commission/election/leadership", label: "Overview" },
          { href: "/commission/election/election-1?tab=college", label: "SAKU Electoral Register" },
          { href: "/vote", label: "Voting desk" },
        ]}
      />

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <StatusPill tone={store.electoralCollege.status === "active" ? "ok" : "warn"}>
          Register {store.electoralCollege.status.replaceAll("_", " ")}
        </StatusPill>
        <p className="mt-3 text-sm text-navy/70">
          {store.electoralCollege.entries.length} derived electors ·{" "}
          {store.electoralCollege.entries.filter((item) => item.electorStatus === "voted").length} voted
        </p>
        {store.electoralCollege.status !== "active" ? (
          <p className="mt-3 text-sm text-navy/60">
            Finalize Election 1 and verify the Electoral College Register before
            the Cabinet desk will unlock a ballot.
          </p>
        ) : (
          <Link href="/vote" className="mt-4 inline-block text-sm font-semibold text-navy underline">
            Open the Cabinet voting desk
          </Link>
        )}
      </section>

      <section className="space-y-4">
        {CABINET_CONTESTS.map((contest) => (
          <article key={contest.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
            <h2 className="font-serif text-2xl text-navy">{contest.title}</h2>
            <p className="text-xs text-navy/50">{contest.instruction}</p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {store.cabinetCandidates
                .filter((candidate) => candidate.contestId === contest.id)
                .map((candidate) => (
                  <li key={candidate.id} className="flex items-center gap-3 rounded-xl bg-cream/80 p-3">
                    <img src={candidate.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
                    <span>
                      <span className="block font-semibold text-navy">{candidate.fullName}</span>
                      {candidate.runningMateName ? (
                        <span className="text-xs text-navy/60">
                          + {candidate.runningMateName} · {candidate.ticketLabel}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
