import { redirect } from "next/navigation";
import { AgentObservationForm } from "@/components/portals/AgentObservationForm";
import { readElectorSession } from "@/lib/elector-session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agent Portal" };

export default async function AgentHomePage() {
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("agent:")) redirect("/agent");
  const agentId = session.electorId.replace("agent:", "");
  const store = await readStore();
  const agent = store.agents.find((item) => item.id === agentId);
  if (!agent) redirect("/agent");
  const stations = store.pollingStations.filter((station) => agent.permittedStationIds.includes(station.id));
  const mine = store.agentObservations.filter((item) => item.agentId === agent.id);
  const attendance = store.agentAttendance.filter((item) => item.agentId === agent.id);

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-navy">
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="rounded-2xl bg-gold/30 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.16em] uppercase">
          DEMO MODE — MOCK DATA ONLY
        </p>
        <h1 className="font-serif text-4xl">Agent Portal</h1>
        <p>
          {agent.fullName} · {agent.agentCode} · accreditation {agent.accreditationStatus}
        </p>
        <p className="text-sm text-navy/65">Observing {agent.candidateName}. You cannot accredit yourself or classify Commission incidents.</p>
        <section className="rounded-2xl border border-navy/10 bg-white p-5">
          <h2 className="font-serif text-2xl">Permitted stations</h2>
          <ul className="mt-2 text-sm">
            {stations.map((station) => (
              <li key={station.id}>
                {station.name} · {station.status}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">Attendance records: {attendance.length}</p>
        </section>
        {agent.accreditationStatus === "ACCREDITED" && stations[0] ? (
          <AgentObservationForm stationId={stations[0].id} />
        ) : null}
        <section className="rounded-2xl border border-navy/10 bg-white p-5">
          <h2 className="font-serif text-2xl">Your submissions</h2>
          <p className="mt-1 text-sm text-navy/55">
            You may view the status of your own reports. You cannot see Commission classification, escalation or
            internal deliberations.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {mine.map((item) => {
              const incident = store.incidents.find((row) => row.id === item.linkedIncidentId);
              return (
                <li key={item.id}>
                  {item.body}
                  {incident ? ` · ${incident.reference} · received` : ""}
                </li>
              );
            })}
            {mine.length === 0 ? <li className="text-navy/50">None yet.</li> : null}
          </ul>
        </section>
      </div>
    </main>
  );
}
