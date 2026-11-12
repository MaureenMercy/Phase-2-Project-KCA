"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { saveElectorSession } from "@/lib/elector-session";
import { readStore, writeStore } from "@/lib/store";
import { pinMatchesStudent } from "@/lib/student-auth";

export async function candidatePortalLogin(input: {
  studentId: string;
  pin: string;
}): Promise<ActionResult> {
  const store = await readStore();
  const application = store.candidateApplications.find(
    (item) => item.studentId.toUpperCase() === input.studentId.trim().toUpperCase(),
  );
  if (!application) return { ok: false, error: "No candidate application is linked to that student ID." };
  const pinOk = await pinMatchesStudent({ pin: input.pin, enrolledPasswordHash: null });
  if (!pinOk && input.pin !== DEMO_PASSWORD) {
    return { ok: false, error: "Student ID or PIN is incorrect." };
  }
  await saveElectorSession({
    kind: "student",
    electorId: `candidate:${application.studentId}`,
    registrationNumber: application.studentId,
    fullName: application.fullName,
    electionId: application.electionId,
    lastActivityAt: Date.now(),
  });
  return { ok: true, next: "/candidate/home" };
}

export async function agentPortalLogin(input: {
  agentCode: string;
  password: string;
}): Promise<ActionResult> {
  const { completeAgentLogin } = await import("@/lib/actions/agent-portal");
  const key = input.agentCode.trim();
  if (!key) return { ok: false, error: "Enter your student registration number or agent code." };
  if (input.password === DEMO_PASSWORD || input.password === "KCAU@2026" || input.password === "202026") {
    return completeAgentLogin({ studentId: key, otp: input.password });
  }
  return completeAgentLogin({ studentId: key, otp: input.password });
}

export async function confirmCandidateVerification(applicationId: string): Promise<ActionResult> {
  const { readElectorSession } = await import("@/lib/elector-session");
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("candidate:")) {
    return { ok: false, error: "Sign in to the Candidate Portal first." };
  }
  const studentId = session.electorId.replace("candidate:", "");
  await writeStore((store) => {
    store.candidateApplications = store.candidateApplications.map((item) =>
      item.id === applicationId && item.studentId === studentId
        ? { ...item, verificationStatus: "VERIFIED" }
        : item,
    );
    return store;
  });
  revalidatePath("/candidate/home");
  return { ok: true };
}

export async function nominateAgent(input: {
  fullName: string;
  registrationNumber: string;
}): Promise<ActionResult> {
  const { inviteAgentAsCandidate } = await import("@/lib/actions/agent-portal");
  if (!input.registrationNumber.trim()) {
    return { ok: false, error: "Enter the nominated agent's student registration number." };
  }
  const result = await inviteAgentAsCandidate({ invitedStudentId: input.registrationNumber });
  if (!result.ok) return result;
  return {
    ok: true,
    next: result.reference,
  };
}

export async function submitAgentObservation(input: {
  body: string;
  stationId: string;
  evidenceName?: string;
  evidenceType?: string;
}): Promise<ActionResult> {
  const { submitAgentIncidentReport } = await import("@/lib/actions/agent-portal");
  return submitAgentIncidentReport({
    category: "conduct",
    description: input.body,
    stationId: input.stationId,
    occurredAt: new Date().toISOString(),
    evidenceName: input.evidenceName,
    evidenceType: input.evidenceType,
  });
}
