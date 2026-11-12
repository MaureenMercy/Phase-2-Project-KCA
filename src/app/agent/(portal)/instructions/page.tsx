import { redirect } from "next/navigation";
import { LockedNotice } from "@/components/agent/AgentShell";
import { agentCan, lockedReason } from "@/lib/agent-access";
import { readAgentFromSession } from "@/lib/agent-session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Observation instructions" };

export default async function InstructionsPage() {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  if (!agentCan(agent, "viewInstructions")) {
    return <LockedNotice title="Instructions unavailable" message={lockedReason(agent, "viewInstructions") ?? ""} />;
  }
  const store = await readStore();

  return (
    <>
      <h1 className="font-serif text-4xl">Observation instructions</h1>
      <p className="mt-2 text-sm text-navy/60">Commission-issued procedures for accredited observation. These are for reading, not for changing election rules.</p>
      <div className="mt-6 space-y-4">
        {store.observationInstructions.map((item) => (
          <article key={item.id} className="rounded-2xl border border-navy/10 bg-white p-6">
            <h2 className="font-serif text-2xl">{item.title}</h2>
            <p className="mt-1 text-sm text-navy/55">{item.summary}</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-navy/75">
              {item.body.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            <a
              className="mt-4 inline-block text-xs font-bold tracking-wide uppercase underline"
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(`${item.title}\n\n${item.body}`)}`}
              download={item.downloadName}
            >
              Download
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
