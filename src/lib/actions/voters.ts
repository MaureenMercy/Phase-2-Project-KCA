"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission, assignedStationId } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";
import type { VoterException } from "@/lib/types";

const ExceptionSchema = z.object({
  fullName: z.string().trim().min(3),
  registrationNumber: z.string().trim().min(3),
  campusId: z.string().min(1),
  issue: z.enum(["MISSING_FROM_REGISTER", "RECORD_MISMATCH", "DOCUMENTATION", "OTHER"]),
  reason: z.string().trim().min(8),
  verificationSource: z.string().trim().min(4),
});

export async function submitVoterException(input: {
  fullName: string;
  registrationNumber: string;
  campusId: string;
  issue: VoterException["issue"];
  reason: string;
  verificationSource: string;
}): Promise<ActionResult> {
  const parsed = ExceptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Complete the exception case details." };

  const gate = await assertPermission("review_voter_exceptions");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const assigned = assignedStationId(gate.session);
  if (gate.session.role === "COMMISSIONER") {
    const station = gate.store.pollingStations.find((item) => item.id === assigned);
    if (!station || station.campusId !== parsed.data.campusId) {
      return { ok: false, error: "You may only submit exception cases for your assigned campus." };
    }
  }

  const student = gate.store.studentElectors.find(
    (item) => item.studentId.toUpperCase() === parsed.data.registrationNumber.toUpperCase(),
  );

  const record: VoterException = {
    id: `exc-${crypto.randomUUID()}`,
    reference: `EXC-${Date.now().toString(36).toUpperCase()}`,
    studentId: student?.studentId ?? null,
    fullName: parsed.data.fullName,
    registrationNumber: parsed.data.registrationNumber,
    campusId: parsed.data.campusId,
    issue: parsed.data.issue,
    reason: parsed.data.reason,
    verificationSource: parsed.data.verificationSource,
    status: "PENDING",
    submittedByWorkId: gate.session.workId,
    submittedByName: gate.session.fullName,
    submittedAt: new Date().toISOString(),
    assignedReviewer: null,
    decisionNote: null,
    decidedBy: null,
    decidedAt: null,
    documents: [],
  };

  await writeStore((store) => {
    store.voterExceptions = [record, ...store.voterExceptions];
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "submit_voter_exception",
    detail: `Submitted ${record.reference}. A Commissioner cannot independently declare this student eligible.`,
    highRisk: false,
    entity: "voter_exception",
    entityId: record.id,
  });
  revalidatePath("/commission/voters");
  return { ok: true };
}

export async function decideVoterException(input: {
  id: string;
  status: "MORE_INFO" | "APPROVED" | "REJECTED";
  decisionNote: string;
}): Promise<ActionResult> {
  const gate = await assertPermission("decide_voter_exceptions");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const record = gate.store.voterExceptions.find((item) => item.id === input.id);
  if (!record) return { ok: false, error: "Exception case not found." };

  await writeStore((store) => {
    store.voterExceptions = store.voterExceptions.map((item) =>
      item.id === input.id
        ? {
            ...item,
            status: input.status,
            decisionNote: input.decisionNote.trim() || item.decisionNote,
            decidedBy: gate.session.fullName,
            decidedAt: new Date().toISOString(),
          }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "decide_voter_exception",
    detail: `${record.reference} marked ${input.status}. ICT does not determine eligibility.`,
    highRisk: false,
    entity: "voter_exception",
    entityId: input.id,
  });
  revalidatePath("/commission/voters");
  return { ok: true };
}
