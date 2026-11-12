import { redirect } from "next/navigation";
import { LockedNotice } from "@/components/agent/AgentShell";
import { CheckInButtons } from "@/components/agent/AgentActionForms";
import { Panel } from "@/components/agent/SummaryCard";
import { agentCan, lockedReason } from "@/lib/agent-access";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { formatDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);
  if (!agentCan(agent, "checkIn")) {
    return <LockedNotice title="Check-in is locked" message={lockedReason(agent, "checkIn") ?? ""} />;
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Attendance & check-in</h1>
      <p className="mt-2 text-sm text-navy/60">
        Check in only at {view.station?.name ?? "your assigned station"}. The portal will reject any other station.
      </p>
      <Panel title="Current status">
        <p>{view.openAttendance ? `Checked in at ${formatDateTime(view.openAttendance.checkInAt)}` : "You are not currently checked in."}</p>
        <div className="mt-4">
          <CheckInButtons checkedIn={Boolean(view.openAttendance)} />
        </div>
      </Panel>
      <Panel title="Attendance history">
        {view.attendance.length === 0 ? <p>No attendance recorded yet.</p> : (
          <ul className="space-y-2">
            {view.attendance.map((item) => (
              <li key={item.id}>
                In {formatDateTime(item.checkInAt)} · Out {formatDateTime(item.checkOutAt)}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
