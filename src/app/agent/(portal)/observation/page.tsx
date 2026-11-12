import { redirect } from "next/navigation";
import { LockedNotice } from "@/components/agent/AgentShell";
import { ObservationForm } from "@/components/agent/AgentActionForms";
import { agentCan, lockedReason } from "@/lib/agent-access";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { formatDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export const metadata = { title: "Election observation" };

export default async function ObservationPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);
  if (!agentCan(agent, "observe") || !view.station) {
    return <LockedNotice title="Observation is locked" message={lockedReason(agent, "observe") ?? "No assigned station."} />;
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Election observation</h1>
      <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
        <ObservationForm stationId={view.station.id} stationName={view.station.name} />
      </div>
      <section className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Your observations</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {view.observations.map((item) => (
            <li key={item.id} className="border-b border-navy/10 pb-3">
              <p className="text-[10px] tracking-wide text-navy/40 uppercase">{item.category} · {formatDateTime(item.occurredAt)}</p>
              <p className="mt-1">{item.body}</p>
            </li>
          ))}
          {view.observations.length === 0 ? <li className="text-navy/50">None yet.</li> : null}
        </ul>
      </section>
    </>
  );
}
