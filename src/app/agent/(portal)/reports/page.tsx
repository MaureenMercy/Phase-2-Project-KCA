import { redirect } from "next/navigation";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { formatDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export const metadata = { title: "My reports" };

export default async function ReportsPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);

  return (
    <>
      <h1 className="font-serif text-4xl">My reports & submissions</h1>
      <p className="mt-2 text-sm text-navy/60">
        Only your own reports are shown. Commission classification, escalation notes and internal discussions are not visible here.
      </p>
      <ul className="mt-6 space-y-3">
        {view.reports.map((item) => (
          <li key={item.id} className="rounded-2xl border border-navy/10 bg-white p-5">
            <p className="text-[10px] tracking-wide text-navy/40 uppercase">{item.publicStatus} · {item.reference}</p>
            <p className="mt-2 text-sm">{item.description}</p>
            <p className="mt-2 text-xs text-navy/50">{formatDateTime(item.recordedAt)}</p>
          </li>
        ))}
        {view.reports.length === 0 ? (
          <li className="rounded-2xl border border-navy/10 bg-white p-5 text-sm text-navy/50">You have not submitted a Commission report yet.</li>
        ) : null}
      </ul>
    </>
  );
}
