import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/agent/StatusBadge";
import { SummaryCard } from "@/components/agent/SummaryCard";
import { accreditationLabel } from "@/lib/agent-access";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { formatDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export const metadata = { title: "Dashboard" };

export default async function AgentDashboardPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const store = await readStore();
  const view = agentContext(store, agent);
  const latestReport = view.reports[0];

  return (
    <>
      <header>
        <p className="text-[11px] tracking-[0.2em] text-navy/40 uppercase">Overview</p>
        <h1 className="mt-1 font-serif text-4xl">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">{view.nextStep}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Candidate I represent" value={agent.candidateName} hint={`${agent.candidatePosition} · ${view.election.shortName ?? "Election 2"}`}>
          <Link href="/agent/association" className="mt-3 inline-block text-xs tracking-wide uppercase underline">View association</Link>
        </SummaryCard>
        <SummaryCard label="Has my accreditation been approved?" value={accreditationLabel(agent.accreditationStatus)} hint={`Application ${agent.applicationReference}`}>
          <div className="mt-3"><StatusBadge status={agent.accreditationStatus} /></div>
        </SummaryCard>
        <SummaryCard
          label="Where am I authorised to observe?"
          value={agent.accreditationStatus === "ACCREDITED" ? view.station?.name ?? "Assigned station pending" : "Not yet authorised"}
          hint={agent.accreditationStatus === "ACCREDITED" ? view.station?.campus : "The Commission must approve station access."}
        />
        <SummaryCard label="Election status" value={view.election.stage.replaceAll("_", " ")} hint={view.election.name} />
        <SummaryCard
          label="Attendance"
          value={view.openAttendance ? "Checked in" : view.attendance.length ? "Checked out" : "No check-in yet"}
          hint={
            view.openAttendance
              ? formatDateTime(view.openAttendance.checkInAt)
              : agent.accreditationStatus === "ACCREDITED"
                ? "Check in when you arrive at your assigned station."
                : "Check-in is available after accreditation."
          }
        />
        <SummaryCard
          label="Report updates"
          value={latestReport ? latestReport.publicStatus : "No reports yet"}
          hint={latestReport ? `${latestReport.reference} · ${formatDateTime(latestReport.recordedAt)}` : "Submitted reports appear here with Commission status only."}
        />
      </div>

      <section className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Outstanding actions</h2>
        <ul className="mt-3 space-y-2 text-sm text-navy/70">
          <li>{view.nextStep}</li>
          {view.unreadCount ? <li>You have {view.unreadCount} unread notification{view.unreadCount === 1 ? "" : "s"}.</li> : <li>No unread notifications.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Recent notifications</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {view.notifications.slice(0, 4).map((item) => (
            <li key={item.id} className="border-b border-navy/10 pb-3">
              <p className="font-semibold">{item.title}</p>
              <p className="text-navy/60">{item.body}</p>
            </li>
          ))}
          {view.notifications.length === 0 ? <li className="text-navy/50">None yet.</li> : null}
        </ul>
        <Link href="/agent/notifications" className="mt-3 inline-block text-xs tracking-wide uppercase underline">All notifications</Link>
      </section>
    </>
  );
}
