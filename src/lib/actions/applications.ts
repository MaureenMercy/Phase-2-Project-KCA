"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";
import type { CandidateApplication } from "@/lib/types";

function refresh() {
  revalidatePath("/commission/candidates");
  revalidatePath("/commission/election");
}

export async function setApplicationVetting(input: {
  id: string;
  vettingStatus: CandidateApplication["vettingStatus"];
  notes: string;
}): Promise<ActionResult> {
  const gate = await assertPermission("approve_candidates");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const application = gate.store.candidateApplications.find((item) => item.id === input.id);
  if (!application) return { ok: false, error: "Application not found." };
  const lock = gate.store.candidateLocks.find((item) => item.electionId === application.electionId);
  if (lock?.status === "LOCKED") {
    return { ok: false, error: "This candidate configuration is locked." };
  }

  await writeStore((store) => {
    store.candidateApplications = store.candidateApplications.map((item) =>
      item.id === input.id
        ? {
            ...item,
            vettingStatus: input.vettingStatus,
            applicationStatus: "UNDER_REVIEW",
            reviewedBy: gate.session.fullName,
            reviewedAt: new Date().toISOString(),
            vettingNotes: input.notes.trim() || item.vettingNotes,
            participationStatus:
              input.vettingStatus === "REJECTED" ? "NOT_SELECTED" : item.participationStatus,
          }
        : item,
    );
    if (application.electionKind === "DELEGATE") {
      store.delegateCandidates = store.delegateCandidates.map((candidate) =>
        candidate.studentId === application.studentId
          ? {
              ...candidate,
              approvalStatus:
                input.vettingStatus === "APPROVED"
                  ? "approved"
                  : input.vettingStatus === "REJECTED"
                    ? "rejected"
                    : "pending",
            }
          : candidate,
      );
    }
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "candidate_vetting",
    detail: `${application.fullName} vetting ${input.vettingStatus}.`,
    highRisk: false,
    entity: "candidate_application",
    entityId: input.id,
  });
  refresh();
  return { ok: true };
}

export async function setCandidateParticipation(input: {
  id: string;
  participationStatus: CandidateApplication["participationStatus"];
}): Promise<ActionResult> {
  const gate = await assertPermission("approve_candidates");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  const application = gate.store.candidateApplications.find((item) => item.id === input.id);
  if (!application) return { ok: false, error: "Application not found." };
  if (application.vettingStatus !== "APPROVED" && input.participationStatus === "SELECTED") {
    return { ok: false, error: "Only approved candidates can be selected for an election." };
  }
  const lock = gate.store.candidateLocks.find((item) => item.electionId === application.electionId);
  if (lock?.status === "LOCKED") {
    return { ok: false, error: "This candidate configuration is locked." };
  }

  await writeStore((store) => {
    store.candidateApplications = store.candidateApplications.map((item) =>
      item.id === input.id ? { ...item, participationStatus: input.participationStatus } : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "candidate_participation",
    detail: `${application.fullName} participation ${input.participationStatus}.`,
    highRisk: false,
    entity: "candidate_application",
    entityId: input.id,
  });
  refresh();
  return { ok: true };
}

export async function sendCandidateVerification(id: string): Promise<ActionResult> {
  const gate = await assertPermission("approve_candidates");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  await writeStore((store) => {
    store.candidateApplications = store.candidateApplications.map((item) =>
      item.id === id ? { ...item, verificationStatus: "SENT" } : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "candidate_verification_sent",
    detail: `Verification request sent for ${id}.`,
    highRisk: false,
    entity: "candidate_application",
    entityId: id,
  });
  refresh();
  return { ok: true };
}

export async function lockCandidateConfiguration(electionId: string): Promise<ActionResult> {
  const gate = await assertPermission("lock_candidate_list");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  await writeStore((store) => {
    store.candidateLocks = store.candidateLocks.map((item) =>
      item.electionId === electionId
        ? {
            ...item,
            status: "LOCKED",
            lockedAt: new Date().toISOString(),
            lockedBy: gate.session.fullName,
          }
        : item,
    );
    store.candidateApplications = store.candidateApplications.map((item) =>
      item.electionId === electionId && item.participationStatus === "SELECTED"
        ? { ...item, configurationStatus: "LOCKED" }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "lock_candidate_list",
    detail: `Locked candidate configuration for ${electionId}.`,
    highRisk: true,
    entity: "candidate_lock",
    entityId: electionId,
  });
  refresh();
  return { ok: true };
}
