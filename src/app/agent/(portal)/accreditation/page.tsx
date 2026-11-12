import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/agent/StatusBadge";
import { Panel } from "@/components/agent/SummaryCard";
import { accreditationLabel } from "@/lib/agent-access";
import { readAgentFromSession } from "@/lib/agent-session";
import { formatDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";
import { agentContext } from "@/lib/agent-view";

export const metadata = { title: "Accreditation" };

export default async function AccreditationPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);

  return (
    <>
      <h1 className="font-serif text-4xl">Accreditation status</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="Accreditation">
          <p><StatusBadge status={agent.accreditationStatus} /></p>
          <p className="mt-3">Reference: {agent.accreditationReference ?? "Issued after a Commission decision"}</p>
          <p>Decision date: {formatDateTime(agent.accreditedAt)}</p>
          <p>Validity: {view.election.name}</p>
        </Panel>
        <Panel title="Application">
          <p><StatusBadge status={agent.applicationStatus} kind="application" /></p>
          <p className="mt-3">Application {agent.applicationReference}</p>
          <p>Submitted {formatDateTime(agent.submittedAt)}</p>
        </Panel>
      </div>
      <Panel title="Authorised access">
        <p>
          {agent.accreditationStatus === "ACCREDITED"
            ? `Approved to observe at ${view.station?.name ?? "the assigned station"} for ${agent.candidateName}.`
            : `${accreditationLabel(agent.accreditationStatus)}: observation, check-in and incident reporting stay closed until the Commission approves accreditation.`}
        </p>
        {agent.decisionNote ? <p className="mt-3">{agent.decisionNote}</p> : null}
      </Panel>
    </>
  );
}
