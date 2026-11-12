import { redirect } from "next/navigation";
import { CorrectionForm } from "@/components/agent/AgentActionForms";
import { Panel } from "@/components/agent/SummaryCard";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { readStore } from "@/lib/store";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);

  return (
    <>
      <h1 className="font-serif text-4xl">My profile</h1>
      <p className="mt-2 text-sm text-navy/60">This is the shared student identity plus your agent profile. National ID is masked.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="Student identity">
          <p>{view.identity?.fullName}</p>
          <p>{view.identity?.studentId}</p>
          <p>{view.identity?.documentTypeLabel}: {view.identity?.nationalIdMasked}</p>
          <p>{view.identity?.phone}</p>
        </Panel>
        <Panel title="Academic record (read-only)">
          <p>{view.identity?.campusName}</p>
          <p>{view.identity?.schoolName}</p>
          <p>{view.identity?.programme}</p>
          <p>{view.identity?.departmentName}</p>
        </Panel>
      </div>
      <Panel title="Request a correction">
        <p className="mb-3">If campus, school, programme or department is wrong, ask the Commission to correct the verified record. You cannot edit it yourself.</p>
        <CorrectionForm />
        {agent.correctionRequest ? <p className="mt-3">Last request: {agent.correctionRequest}</p> : null}
      </Panel>
    </>
  );
}
