import { redirect } from "next/navigation";
import { AgentShell } from "@/components/agent/AgentShell";
import { readAgentFromSession } from "@/lib/agent-session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  const store = await readStore();
  const unreadCount = store.agentNotifications.filter(
    (item) => (item.agentId === agent.id || item.studentId === agent.studentId) && !item.read,
  ).length;

  return (
    <AgentShell agent={agent} unreadCount={unreadCount}>
      {children}
    </AgentShell>
  );
}
