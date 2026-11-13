import { redirect } from "next/navigation";
import { LockedNotice } from "@/components/agent/AgentShell";
import { IncidentForm } from "@/components/agent/AgentActionForms";
import { agentCan, lockedReason } from "@/lib/agent-access";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { readStore } from "@/lib/store";

export const metadata = { title: "Submit incident" };

export default async function ReportPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);
  if (!agentCan(agent, "reportIncident") || !view.station) {
    return <LockedNotice title="Incident reporting is locked" message={lockedReason(agent, "reportIncident") ?? ""} />;
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Submit incident / observation</h1>
      <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
        <IncidentForm stationId={view.station.id} stationName={view.station.name} />
      </div>
    </>
  );
}
