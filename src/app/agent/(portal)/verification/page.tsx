import { redirect } from "next/navigation";
import { LockedNotice } from "@/components/agent/AgentShell";
import { agentCan, lockedReason } from "@/lib/agent-access";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { readStore } from "@/lib/store";

export const metadata = { title: "Candidate and ballot verification" };

export default async function VerificationPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  if (!agentCan(agent, "verifyBallot")) {
    return <LockedNotice title="Verification is locked" message={lockedReason(agent, "verifyBallot") ?? ""} />;
  }
  const view = agentContext(await readStore(), agent);

  return (
    <>
      <h1 className="font-serif text-4xl">Candidate & ballot verification</h1>
      <p className="mt-2 text-sm text-navy/60">
        Read-only. You can confirm how the candidate and ballot appear. You cannot change candidate records, positions or ballot structure.
      </p>
      <article className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
        <p className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Your candidate</p>
        <div className="mt-3 flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={agent.candidatePhoto} alt="" className="h-24 w-24 rounded-xl object-cover" />
          <div>
            <h2 className="font-serif text-2xl">{agent.candidateName}</h2>
            <p>{agent.candidatePosition}</p>
            <p className="text-sm text-navy/55">{view.election.name}</p>
          </div>
        </div>
      </article>
      <section className="mt-4 rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Ballot appearance for this contest</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {view.ballotCandidates.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-xl bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.photo} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <div>
                <p className="font-semibold">{item.fullName}</p>
                {item.runningMateName ? <p className="text-sm text-navy/60">with {item.runningMateName}</p> : null}
                {item.ticketLabel ? <p className="text-xs uppercase tracking-wide text-navy/40">{item.ticketLabel}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
