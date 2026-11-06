"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { leadershipPositionLabel, toCabinetCandidate, upsertCabinetCandidate } from "@/lib/candidate-map";
import { parseCourseValue } from "@/lib/courses";
import { assertPermission } from "@/lib/guard";
import { portraitDataUri } from "@/lib/portraits";
import { appendAudit, writeStore } from "@/lib/store";
import type { ActionResult } from "@/lib/actions/auth";
import { CABINET_CONTEST_IDS } from "@/lib/types";

const LeadershipSchema = z.object({
  fullName: z.string().trim().min(3, "Enter the candidate’s full name.").max(80),
  contestId: z.enum(CABINET_CONTEST_IDS),
  ticket: z.string().trim().min(2, "Enter a ticket or Independent.").max(60),
  campus: z.string().trim().min(2, "Choose a campus."),
  runningMateName: z.string().trim().max(80).optional(),
});

const DelegateSchema = z.object({
  fullName: z.string().trim().min(3, "Enter the candidate’s full name.").max(80),
  studentId: z
    .string()
    .trim()
    .regex(/^[0-9]{2}\/[0-9]{4,6}$/, "Use an admission number such as 24/01299."),
  course: z.string().trim().min(1, "Choose the electoral unit this delegate is contesting."),
});

function hueFrom(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
}

function refreshCandidatePages() {
  revalidatePath("/commission/candidates");
  revalidatePath("/commission/election/election-1");
  revalidatePath("/commission/election/leadership");
  revalidatePath("/commission/dashboard");
}

export async function addLeadershipCandidate(input: {
  fullName: string;
  contestId: string;
  ticket: string;
  campus: string;
  runningMateName?: string;
}): Promise<ActionResult> {
  const parsed = LeadershipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the leadership nomination." };
  }
  if (parsed.data.contestId === "president-ticket" && !parsed.data.runningMateName?.trim()) {
    return { ok: false, error: "A President ticket needs a Vice President running mate." };
  }

  const gate = await assertPermission("approve_candidates");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  const id = `cand-${crypto.randomUUID().slice(0, 8)}`;
  const hue = hueFrom(parsed.data.fullName);
  const record = {
    id,
    fullName: parsed.data.fullName,
    ticket: parsed.data.ticket,
    position: leadershipPositionLabel(parsed.data.contestId),
    campus: parsed.data.campus,
    contestId: parsed.data.contestId,
    runningMateName: parsed.data.runningMateName?.trim() || undefined,
    status: "approved" as const,
    photo: portraitDataUri(parsed.data.fullName, hue),
    reviewedBy: gate.session.fullName,
    reviewedAt: new Date().toISOString(),
  };
  const cabinet = toCabinetCandidate(record, hue);
  if (!cabinet) return { ok: false, error: "That leadership position could not be placed on the Cabinet ballot." };

  await writeStore((store) => {
    store.candidates = [record, ...store.candidates];
    store.cabinetCandidates = upsertCabinetCandidate(store.cabinetCandidates, cabinet);
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "add_leadership_candidate",
    detail: `Added leadership candidate ${parsed.data.fullName} for ${record.position}.`,
    highRisk: false,
    entity: "candidate",
    entityId: id,
  });
  refreshCandidatePages();
  return { ok: true };
}

export async function addDelegateCandidate(input: {
  fullName: string;
  studentId: string;
  course: string;
}): Promise<ActionResult> {
  const parsed = DelegateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the delegate nomination." };
  }

  const course = parseCourseValue(parsed.data.course);
  if (!course) return { ok: false, error: "Choose a campus, school, and course from the official list." };

  const gate = await assertPermission("approve_candidates");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  const studentId = parsed.data.studentId.trim();
  const duplicate = gate.store.delegateCandidates.some(
    (item) => item.studentId.toUpperCase() === studentId.toUpperCase() && item.status === "active",
  );
  if (duplicate) {
    return { ok: false, error: "That admission number is already a delegate candidate." };
  }

  const id = `del-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  await writeStore((store) => {
    store.delegateCandidates.push({
      id,
      studentId,
      electionId: store.election.id,
      fullName: parsed.data.fullName,
      photo: portraitDataUri(parsed.data.fullName, hueFrom(parsed.data.fullName)),
      campusId: course.campusId,
      schoolId: course.schoolId,
      departmentId: course.departmentId,
      candidateType: "DELEGATE",
      approvalStatus: "approved",
      votesReceived: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "add_delegate_candidate",
    detail: `Added delegate candidate ${parsed.data.fullName} (${studentId}) for ${course.label}.`,
    highRisk: false,
    entity: "delegate_candidate",
    entityId: id,
  });
  refreshCandidatePages();
  return { ok: true };
}

