import { ActionButton } from "@/components/commission/ActionButton";
import { AgentPolicyForm, AssignStationForm } from "@/components/commission/AgentPolicyForm";
import { ModuleSubnav, PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { decideAgentAccreditation, recordAgentAttendance } from "@/lib/actions/agents";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Agent management" };
export const dynamic = "force-dynamic";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const { tab: rawTab } = await searchParams;
  const tab = rawTab ?? "register";
  const canAccredit = isAllowedNow(session.role!, "accredit_agents", store.election.stage);
  const canAttend = isAllowedNow(session.role!, "station_operations", store.election.stage);
  const assigned = store.pollingStations.find((station) => session.pollingStationIds?.includes(station.id));
  const agents =
    session.role === "COMMISSIONER" && assigned
      ? store.agents.filter((agent) => agent.permittedStationIds.includes(assigned.id) || agent.accreditationStatus === "PENDING")
      : store.agents;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Agent management" title="Nominations, accreditation and station access">
        Agents are nominated by SAKU Council candidates, not by the Commission creating them first.
        Agents have a separate login. They cannot accredit themselves or classify Commission incidents.
      </PageHeader>
      <ModuleSubnav
        current={`/commission/agents${tab === "register" ? "" : `?tab=${tab}`}`}
        items={[
          { href: "/commission/agents", label: "Agent register" },
          { href: "/commission/agents?tab=invitations", label: "Invitations" },
          { href: "/commission/agents?tab=attendance", label: "Attendance" },
          { href: "/commission/agents?tab=observations", label: "Observations" },
          { href: "/agent", label: "Agent Portal" },
        ]}
      />
      <AgentPolicyForm max={store.agentPolicy.maxAgentsPerCandidate} />

      {tab === "register" ? (
        <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/90">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Stations</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-t border-navy/10">
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-navy">{agent.fullName}</span>
                    <span className="font-mono text-xs text-navy/50">{agent.agentCode}</span>
                  </td>
                  <td className="px-4 py-3">{agent.candidateName}</td>
                  <td className="px-4 py-3">
                    {agent.permittedStationIds
                      .map((id) => store.pollingStations.find((station) => station.id === id)?.name)
                      .join(", ") || "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={agent.accreditationStatus === "ACCREDITED" ? "ok" : "warn"}>
                      {agent.accreditationStatus}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    {canAccredit ? (
                      <div className="flex flex-col gap-2">
                        {agent.accreditationStatus === "PENDING" ? (
                          <>
                            <ActionButton
                              label="Accredit"
                              run={decideAgentAccreditation}
                              args={{ agentId: agent.id, decision: "ACCREDITED" }}
                            />
                            <ActionButton
                              label="Decline"
                              run={decideAgentAccreditation}
                              args={{ agentId: agent.id, decision: "DECLINED" }}
                            />
                          </>
                        ) : null}
                        {agent.accreditationStatus === "ACCREDITED" ? (
                          <>
                            <ActionButton
                              label="Suspend"
                              run={decideAgentAccreditation}
                              args={{ agentId: agent.id, decision: "SUSPENDED" }}
                            />
                            <ActionButton
                              label="Revoke"
                              run={decideAgentAccreditation}
                              args={{ agentId: agent.id, decision: "REVOKED" }}
                            />
                            <AssignStationForm
                              agentId={agent.id}
                              stations={store.pollingStations.map((station) => ({ id: station.id, name: station.name }))}
                            />
                          </>
                        ) : null}
                        {agent.accreditationStatus === "SUSPENDED" ? (
                          <ActionButton
                            label="Restore"
                            run={decideAgentAccreditation}
                            args={{ agentId: agent.id, decision: "ACCREDITED" }}
                          />
                        ) : null}
                      </div>
                    ) : canAttend && agent.accreditationStatus === "ACCREDITED" ? (
                      <div className="flex flex-col gap-2">
                        <ActionButton
                          label="Check in"
                          run={recordAgentAttendance}
                          args={{ agentId: agent.id, action: "checkin" }}
                        />
                        <ActionButton
                          label="Check out"
                          run={recordAgentAttendance}
                          args={{ agentId: agent.id, action: "checkout" }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-navy/40">View</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "invitations" ? (
        <ul className="rounded-2xl border border-navy/10 bg-white/90 p-5 text-sm">
          {store.agentInvitations.map((item) => (
            <li key={item.id} className="border-b border-navy/10 py-3">
              <span className="font-mono">{item.reference}</span> · {item.invitedFullName} invited by {item.candidateName} · {item.status}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "attendance" ? (
        <ul className="rounded-2xl border border-navy/10 bg-white/90 p-5 text-sm">
          {store.agentAttendance.length === 0 ? <li className="text-navy/50">No attendance recorded yet.</li> : null}
          {store.agentAttendance.map((item) => {
            const agent = store.agents.find((row) => row.id === item.agentId);
            return (
              <li key={item.id} className="border-b border-navy/10 py-3">
                {agent?.fullName} · {item.checkInAt ? `in ${item.checkInAt}` : "not in"} · {item.checkOutAt ? `out ${item.checkOutAt}` : "on site"}
              </li>
            );
          })}
        </ul>
      ) : null}

      {tab === "observations" ? (
        <ul className="space-y-3">
          {store.agentObservations.map((item) => {
            const agent = store.agents.find((row) => row.id === item.agentId);
            return (
              <li key={item.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
                <p className="text-xs tracking-wide text-navy/40 uppercase">Agent-originated report</p>
                <p className="mt-1 font-semibold text-navy">{agent?.fullName}</p>
                <p className="mt-2 text-sm text-navy/70">{item.body}</p>
              </li>
            );
          })}
          {store.agentObservations.length === 0 ? (
            <li className="rounded-2xl border border-navy/10 bg-white/90 p-5 text-sm text-navy/50">
              No agent observations yet. Agents submit through the Agent Portal.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
