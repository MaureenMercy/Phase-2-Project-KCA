"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission, assignedStationId } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";

export async function decideAgentAccreditation(input: {
  agentId: string;
  decision: "ACCREDITED" | "DECLINED";
}): Promise<ActionResult> {
  const gate = await assertPermission("accredit_agents");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const agent = gate.store.agents.find((item) => item.id === input.agentId);
  if (!agent) return { ok: false, error: "Agent record not found." };

  await writeStore((store) => {
    store.agents = store.agents.map((item) =>
      item.id === input.agentId
        ? {
            ...item,
            accreditationStatus: input.decision,
            accreditedAt: input.decision === "ACCREDITED" ? new Date().toISOString() : null,
            accreditedBy: gate.session.fullName,
          }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "accredit_agent",
    detail: `${agent.fullName} (${agent.agentCode}) ${input.decision.toLowerCase()}.`,
    highRisk: false,
    entity: "agent",
    entityId: agent.id,
  });
  revalidatePath("/commission/agents");
  return { ok: true };
}

export async function recordAgentAttendance(input: {
  agentId: string;
  action: "checkin" | "checkout";
}): Promise<ActionResult> {
  const gate = await assertPermission("station_operations");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  const stationId = assignedStationId(gate.session);
  if (!stationId) return { ok: false, error: "Attendance is recorded at your assigned station only." };

  const agent = gate.store.agents.find((item) => item.id === input.agentId);
  if (!agent) return { ok: false, error: "Agent record not found." };
  if (agent.accreditationStatus !== "ACCREDITED") {
    return { ok: false, error: "This agent is not accredited." };
  }
  if (!agent.permittedStationIds.includes(stationId)) {
    return { ok: false, error: "This agent is not accredited to observe your assigned station." };
  }

  await writeStore((store) => {
    const existing = store.agentAttendance.find(
      (item) => item.agentId === input.agentId && item.stationId === stationId && !item.checkOutAt,
    );
    if (input.action === "checkin") {
      if (existing) return store;
      store.agentAttendance.push({
        id: `att-${crypto.randomUUID()}`,
        agentId: input.agentId,
        stationId,
        checkInAt: new Date().toISOString(),
        checkOutAt: null,
        recordedBy: gate.session.fullName,
      });
      return store;
    }
    store.agentAttendance = store.agentAttendance.map((item) =>
      item.agentId === input.agentId && item.stationId === stationId && !item.checkOutAt
        ? { ...item, checkOutAt: new Date().toISOString(), recordedBy: gate.session.fullName }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "agent_attendance",
    detail: `${input.action} recorded for ${agent.agentCode} at ${stationId}.`,
    highRisk: false,
    stationId,
    entity: "agent",
    entityId: agent.id,
  });
  revalidatePath("/commission/agents");
  return { ok: true };
}
