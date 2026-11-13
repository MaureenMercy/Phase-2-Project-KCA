import { redirect } from "next/navigation";
import { ActionButton } from "@/components/commission/ActionButton";
import { confirmCandidateVerification } from "@/lib/actions/portals";
import { AgentNominateForm } from "@/components/portals/AgentNominateForm";
import { readElectorSession } from "@/lib/elector-session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Candidate Portal" };

export default async function CandidateHomePage() {
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("candidate:")) redirect("/candidate");
  const studentId = session.electorId.replace("candidate:", "");
  const store = await readStore();
  const applications = store.candidateApplications.filter((item) => item.studentId === studentId);
  const council = applications.find((item) => item.electionKind === "COUNCIL");
  const agents = store.agents.filter((item) => item.candidateStudentId === studentId);
  const invitations = store.agentInvitations.filter((item) => item.candidateStudentId === studentId);

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-navy">
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="rounded-2xl bg-gold/30 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.16em] uppercase">
          DEMO MODE — MOCK DATA ONLY
        </p>
        <h1 className="font-serif text-4xl">Candidate Portal</h1>
        <p>{session.fullName} · {studentId}</p>
        {applications.map((item) => (
          <article key={item.id} className="rounded-2xl border border-navy/10 bg-white p-5">
            <h2 className="font-serif text-2xl">{item.positionLabel}</h2>
            <p className="text-sm text-navy/60">
              Vetting {item.vettingStatus} · Participation {item.participationStatus} · Verification {item.verificationStatus}
            </p>
            {item.verificationStatus === "SENT" ? (
              <div className="mt-3">
                <ActionButton label="Confirm ballot appearance" run={confirmCandidateVerification} args={item.id} />
              </div>
            ) : null}
          </article>
        ))}
        {council ? (
          <section className="rounded-2xl border border-navy/10 bg-white p-5">
            <h2 className="font-serif text-2xl">Nominate an agent</h2>
            <p className="text-sm text-navy/60">Only SAKU Council candidates may nominate agents.</p>
            <AgentNominateForm />
            <h3 className="mt-6 font-semibold">Invitations</h3>
            <ul className="mt-2 text-sm">
              {invitations.map((item) => (
                <li key={item.id} className="border-b border-navy/10 py-2">
                  <span className="font-mono">{item.reference}</span> · {item.invitedFullName} · {item.status}
                </li>
              ))}
            </ul>
            <h3 className="mt-4 font-semibold">Applications</h3>
            <ul className="mt-2 text-sm">
              {agents.map((agent) => (
                <li key={agent.id}>
                  {agent.fullName} · {agent.agentCode} · {agent.accreditationStatus}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="text-sm text-navy/60">Delegate candidates do not nominate agents in this specification.</p>
        )}
      </div>
    </main>
  );
}
