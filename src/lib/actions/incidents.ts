"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission, assignedStationId } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";
import type { IncidentRecord } from "@/lib/types";

const EVIDENCE_DIR = path.join(process.cwd(), "data", "evidence");

export async function recordIncident(input: {
  category: IncidentRecord["category"];
  description: string;
  occurredAt: string;
}): Promise<ActionResult> {
  const gate = await assertPermission("record_incidents");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const stationId = assignedStationId(gate.session);
  if (!stationId) {
    return { ok: false, error: "Incident recording is a station-commissioner function. Central roles review the consolidated log." };
  }
  if (!input.description.trim()) return { ok: false, error: "Describe the incident." };

  const reference = `INC-${Date.now().toString(36).toUpperCase()}`;
  const record: IncidentRecord = {
    id: `inc-${crypto.randomUUID()}`,
    electionId: gate.store.election.id,
    stationId,
    reportedByWorkId: gate.session.workId,
    reportedByName: gate.session.fullName,
    reporterRole: gate.session.role!,
    category: input.category,
    description: input.description.trim(),
    occurredAt: input.occurredAt || new Date().toISOString(),
    recordedAt: new Date().toISOString(),
    status: "open",
    evidence: [],
    reference,
  };

  await writeStore((store) => {
    store.incidents = [record, ...store.incidents];
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "record_incident",
    detail: `Recorded incident ${reference} at ${stationId}.`,
    highRisk: false,
    stationId,
    entity: "incident",
    entityId: record.id,
    electionStage: gate.store.election.stage,
  });
  revalidatePath("/commission/incidents");
  return { ok: true };
}

export async function uploadIncidentEvidence(
  incidentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const gate = await assertPermission("record_incidents");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const incident = gate.store.incidents.find((item) => item.id === incidentId);
  if (!incident) return { ok: false, error: "Incident not found." };

  const stationId = assignedStationId(gate.session);
  if (stationId && incident.stationId !== stationId) {
    return { ok: false, error: "You may only attach evidence to incidents from your assigned station." };
  }

  const file = formData.get("evidence");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo or video to upload." };
  }

  const storedName = `${incident.reference}-${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(EVIDENCE_DIR, storedName), buffer);

  const evidenceRef = `EVD-${incident.reference}-${incident.evidence.length + 1}`;
  await writeStore((store) => {
    store.incidents = store.incidents.map((item) =>
      item.id === incidentId
        ? {
            ...item,
            evidence: [
              ...item.evidence,
              {
                id: `ev-${crypto.randomUUID()}`,
                filename: file.name,
                mimeType: file.type || "application/octet-stream",
                storedName,
                reference: evidenceRef,
                uploadedAt: new Date().toISOString(),
                uploadedBy: gate.session.fullName,
              },
            ],
          }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "upload_evidence",
    detail: `Uploaded evidence ${evidenceRef} for ${incident.reference}.`,
    highRisk: false,
    stationId: incident.stationId,
    entity: "evidence",
    entityId: evidenceRef,
  });
  revalidatePath("/commission/incidents");
  return { ok: true };
}

export async function escalateIncident(incidentId: string, note: string): Promise<ActionResult> {
  const gate = await assertPermission("view_incidents");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  await writeStore((store) => {
    store.incidents = store.incidents.map((item) =>
      item.id === incidentId
        ? { ...item, status: "escalated", escalationNote: note.trim() }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "escalate_incident",
    detail: `Escalated incident ${incidentId} to Legal / Dispute review.`,
    highRisk: false,
    entity: "incident",
    entityId: incidentId,
  });
  revalidatePath("/commission/incidents");
  revalidatePath("/commission/legal");
  return { ok: true };
}
