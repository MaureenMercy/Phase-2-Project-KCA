"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";

export async function initiateEmergency(input: {
  kind: "PAUSE" | "RESUME";
  reason: string;
  evidenceNote: string;
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

  const id = `emg-${crypto.randomUUID()}`;
  await writeStore((store) => {
    store.emergencies = [
      {
        id,
        electionId: store.election.id,
        kind: input.kind,
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
  await writeStore((store) => {
    store.election.emergencyStatus = nextStatus;
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
