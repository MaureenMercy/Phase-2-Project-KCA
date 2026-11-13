import { redirect } from "next/navigation";
import { Panel } from "@/components/agent/SummaryCard";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { readStore } from "@/lib/store";

export const metadata = { title: "Polling station access" };

export default async function StationPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);
  const approved = agent.accreditationStatus === "ACCREDITED";

  return (
    <>
      <h1 className="font-serif text-4xl">Polling station access</h1>
      <p className="mt-2 text-sm text-navy/60">You cannot grant yourself station access. Only the Electoral Commission assigns it.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="Assigned campus">{view.station?.campus ?? "Not assigned"}</Panel>
        <Panel title="Assigned polling station">{view.station?.name ?? "Not assigned"}</Panel>
        <Panel title="Access status">{approved ? "Approved for the assigned station" : "Requested — awaiting Commission approval"}</Panel>
        <Panel title="Requested station">{agent.requestedStationId ? view.station?.name ?? agent.requestedStationId : "None"}</Panel>
      </div>
      <Panel title="Access instructions">
        <p>{agent.accessInstructions}</p>
      </Panel>
    </>
  );
}
