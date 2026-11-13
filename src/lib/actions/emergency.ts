"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";

export async function initiateEmergency(input: {
  kind: "PAUSE" | "RESUME";
  reason: string;
  evidenceNote: string;
  scope?: "STATION" | "ALL";
  stationIds?: string[];
}): Promise<ActionResult> {
  const gate = await assertPermission("initiate_emergency");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }
  if (!input.reason.trim()) return { ok: false, error: "A reason is required for the audit record." };

  const pending = gate.store.emergencies.find((item) => item.status === "pending_authorization");
  if (pending) {
    return { ok: false, error: "A pending emergency action already awaits the second authorization." };
  }

  if (input.kind === "PAUSE" && gate.store.election.emergencyStatus === "PAUSED") {
    return { ok: false, error: "The election is already paused." };
  }
  if (input.kind === "RESUME" && gate.store.election.emergencyStatus === "RUNNING") {
    return { ok: false, error: "The election is not paused." };
  }

  const scope = input.scope === "STATION" ? "STATION" : "ALL";
  const stationIds = scope === "STATION" ? input.stationIds?.filter(Boolean) ?? [] : gate.store.pollingStations.map((item) => item.id);
  if (scope === "STATION" && stationIds.length === 0) {
    return { ok: false, error: "Select the affected campus/station. An incident at one campus must not automatically freeze the others." };
  }

  const id = `emg-${crypto.randomUUID()}`;
  await writeStore((store) => {
    store.emergencies = [
      {
        id,
        electionId: store.election.id,
        kind: input.kind,
        scope,
        stationIds,
        initiatedByWorkId: gate.session.workId,
        initiatedByName: gate.session.fullName,
        initiatedAt: new Date().toISOString(),
        authorizedByWorkId: null,
        authorizedByName: null,
        authorizedAt: null,
        reason: input.reason.trim(),
        evidenceNote: input.evidenceNote.trim(),
        statusBefore: store.election.emergencyStatus,
        statusAfter: null,
        status: "pending_authorization",
      },
      ...store.emergencies,
    ];
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "initiate_emergency",
    detail: `Initiated emergency ${input.kind} — awaiting second authorization.`,
    highRisk: true,
    entity: "emergency",
    entityId: id,
    reason: input.reason.trim(),
  });
  revalidatePath("/commission/emergency");
  return { ok: true };
}

export async function authorizeEmergency(id: string): Promise<ActionResult> {
  const gate = await assertPermission("authorize_emergency");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  const action = gate.store.emergencies.find((item) => item.id === id);
  if (!action || action.status !== "pending_authorization") {
    return { ok: false, error: "There is no pending emergency action to authorize." };
  }
  if (action.initiatedByWorkId === gate.session.workId) {
    return { ok: false, error: "Two-person control: the initiator cannot authorize their own emergency action." };
  }

  const nextStatus = action.kind === "PAUSE" ? "PAUSED" : "RUNNING";
  const freezeAll = action.scope === "ALL" || action.stationIds.length >= 4;
  await writeStore((store) => {
    if (freezeAll) {
      store.election.emergencyStatus = nextStatus;
      store.elections = store.elections.map((item) =>
        item.id === store.election.id ? { ...item, emergencyStatus: nextStatus } : item,
      );
    }
    store.pollingStations = store.pollingStations.map((station) =>
      action.stationIds.includes(station.id)
        ? {
            ...station,
            frozen: action.kind === "PAUSE",
            frozenAt: action.kind === "PAUSE" ? new Date().toISOString() : null,
            frozenReason: action.kind === "PAUSE" ? action.reason : null,
          }
        : station,
    );
    store.election.updatedAt = new Date().toISOString();
    store.emergencies = store.emergencies.map((item) =>
      item.id === id
        ? {
            ...item,
            authorizedByWorkId: gate.session.workId,
            authorizedByName: gate.session.fullName,
            authorizedAt: new Date().toISOString(),
            statusAfter: nextStatus,
            status: "authorized",
          }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "authorize_emergency",
    detail: `Authorized emergency ${action.kind}. Election is now ${nextStatus}. Technical infrastructure continues operating.`,
    highRisk: true,
    entity: "emergency",
    entityId: id,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
