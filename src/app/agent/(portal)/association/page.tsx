import { redirect } from "next/navigation";
import { Panel } from "@/components/agent/SummaryCard";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { readStore } from "@/lib/store";

export const metadata = { title: "Candidate association" };

export default async function AssociationPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);

  return (
    <>
      <h1 className="font-serif text-4xl">Candidate association</h1>
      <p className="mt-2 text-sm text-navy/60">This link was created from the candidate’s invitation. You cannot change it.</p>
      <article className="mt-6 flex flex-col gap-6 rounded-2xl border border-navy/10 bg-white p-6 md:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={agent.candidatePhoto} alt={`Portrait of ${agent.candidateName}`} className="h-40 w-40 rounded-2xl object-cover" />
        <div>
          <p className="text-[11px] tracking-[0.18em] text-navy/40 uppercase">You represent</p>
          <h2 className="mt-1 font-serif text-3xl">{agent.candidateName}</h2>
          <p className="mt-1 text-navy/65">{agent.candidatePosition}</p>
          <p className="mt-1 text-sm">{view.election.name}</p>
          <p className="mt-3 font-mono text-sm">Invitation {agent.invitationReference}</p>
          <p className="font-mono text-sm">Association {agent.applicationReference}</p>
        </div>
      </article>
      <Panel title="Association status">
        <p>Nomination started with the candidate. Accreditation is a separate Commission decision.</p>
      </Panel>
    </>
  );
}
