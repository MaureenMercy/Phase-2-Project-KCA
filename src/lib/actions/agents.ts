"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission, assignedStationId } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";
import type { AgentAccreditationStatus } from "@/lib/types";

function notifyAgent(
  store: {
    agentNotifications: {
      id: string;
      agentId: string;
      studentId: string;
      title: string;
      body: string;
      href: string;
      createdAt: string;
      read: boolean;
      kind: "accreditation" | "station" | "application" | "invitation" | "instruction" | "report";
    }[];
  },
  input: { agentId: string; studentId: string; title: string; body: string; href: string; kind: "accreditation" | "station" },
) {
  store.agentNotifications.unshift({
    id: `an-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...input,
  });
}

export async function decideAgentAccreditation(input: {
  agentId: string;
  decision: AgentAccreditationStatus;
  note?: string;
}): Promise<ActionResult> {
  const gate = await assertPermission("accredit_agents");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const agent = gate.store.agents.find((item) => item.id === input.agentId);
  if (!agent) return { ok: false, error: "Agent record not found." };

  const nowIso = new Date().toISOString();
  await writeStore((store) => {
    store.agents = store.agents.map((item) => {
      if (item.id !== input.agentId) return item;
      const stationId = item.assignedStationId || item.requestedStationId;
      const campusId =
        item.assignedCampusId ||
        store.pollingStations.find((station) => station.id === stationId)?.campusId ||
        item.requestedCampusId;
      const accredited = input.decision === "ACCREDITED";
      return {
        ...item,
        accreditationStatus: input.decision,
        applicationStatus:
          input.decision === "ACCREDITED"
            ? "APPROVED"
            : input.decision === "DECLINED" || input.decision === "REVOKED"
              ? "REJECTED"
              : item.applicationStatus,
        accreditedAt: accredited || input.decision === "SUSPENDED" || input.decision === "REVOKED" ? nowIso : item.accreditedAt,
        accreditedBy: gate.session.fullName,
        decisionNote: input.note?.trim() || item.decisionNote,
        accreditationReference: item.accreditationReference || `ACC-${item.agentCode}`,
        assignedStationId: accredited ? stationId : item.assignedStationId,
        assignedCampusId: accredited ? campusId ?? null : item.assignedCampusId,
        permittedStationIds: accredited && stationId ? [stationId] : item.permittedStationIds,
        accessInstructions: accredited
          ? "Check in only at your assigned campus polling station on an authorised Commission computer."
          : item.accessInstructions,
        updatedAt: nowIso,
      };
    });
    const updated = store.agents.find((item) => item.id === input.agentId);
    if (updated) {
      const titles: Record<AgentAccreditationStatus, string> = {
        ACCREDITED: "Accreditation approved",
        PENDING: "Accreditation pending",
        DECLINED: "Accreditation declined",
        SUSPENDED: "Accreditation suspended",
        REVOKED: "Accreditation revoked",
      };
      notifyAgent(store, {
        agentId: updated.id,
        studentId: updated.studentId,
        title: titles[input.decision],
        body:
          input.note?.trim() ||
          `The Electoral Commission updated your accreditation to ${input.decision.toLowerCase()}.`,
        href: "/agent/accreditation",
        kind: "accreditation",
      });
    }
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
  revalidatePath("/agent/home");
  revalidatePath("/agent/accreditation");
  return { ok: true };
}

export async function assignAgentStation(input: {
  agentId: string;
  stationId: string;
}): Promise<ActionResult> {
  const gate = await assertPermission("accredit_agents");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  const station = gate.store.pollingStations.find((item) => item.id === input.stationId);
  if (!station) return { ok: false, error: "Unknown polling station." };
  const agent = gate.store.agents.find((item) => item.id === input.agentId);
  if (!agent) return { ok: false, error: "Agent record not found." };

  await writeStore((store) => {
    store.agents = store.agents.map((item) =>
      item.id === input.agentId
        ? {
            ...item,
            assignedStationId: station.id,
            assignedCampusId: station.campusId,
            permittedStationIds: item.accreditationStatus === "ACCREDITED" ? [station.id] : item.permittedStationIds,
            accessInstructions: "Observe only at the Commission-assigned station. You cannot grant yourself access.",
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    notifyAgent(store, {
      agentId: agent.id,
      studentId: agent.studentId,
      title: "Station assignment updated",
      body: `The Commission assigned ${station.name}. You cannot change this yourself.`,
      href: "/agent/station",
      kind: "station",
    });
    return store;
  });
  revalidatePath("/commission/agents");
  revalidatePath("/agent/station");
  return { ok: true };
}

export async function setMaxAgentsPerCandidate(max: number): Promise<ActionResult> {
  const gate = await assertPermission("accredit_agents");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if (!Number.isInteger(max) || max < 1 || max > 8) {
    return { ok: false, error: "Set a whole number between 1 and 8." };
  }
  await writeStore((store) => {
    store.agentPolicy = { maxAgentsPerCandidate: max };
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "configure_agent_limit",
    detail: `Maximum agents per candidate set to ${max}.`,
    highRisk: false,
    entity: "agent_policy",
    entityId: "maxAgentsPerCandidate",
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
