import { redirect } from "next/navigation";
import { readAgentFromSession } from "@/lib/agent-session";
import { agentContext } from "@/lib/agent-view";
import { formatDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const view = agentContext(await readStore(), agent);

  return (
    <>
      <h1 className="font-serif text-4xl">Notifications</h1>
      <p className="mt-2 text-sm text-navy/60">Simulated notices only in DEMO MODE.</p>
      <ul className="mt-6 space-y-3">
        {view.notifications.map((item) => (
          <li key={item.id} className="rounded-2xl border border-navy/10 bg-white p-5">
            <p className="text-[10px] tracking-wide text-navy/40 uppercase">{item.kind} · {formatDateTime(item.createdAt)}</p>
            <p className="mt-1 font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-navy/65">{item.body}</p>
          </li>
        ))}
        {view.notifications.length === 0 ? <li className="text-sm text-navy/50">No notifications.</li> : null}
      </ul>
    </>
  );
}
