"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { saveElectorSession } from "@/lib/elector-session";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import { evidenceKind } from "@/lib/incidents";
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
  const store = await readStore();
  const agent = store.agents.find(
    (item) => item.agentCode.toUpperCase() === input.agentCode.trim().toUpperCase(),
  );
  if (!agent) return { ok: false, error: "Unknown agent code." };
  if (input.password !== DEMO_PASSWORD && input.password !== "KCAU@2026") {
    return { ok: false, error: "Agent code or password is incorrect." };
  }
  await saveElectorSession({
    kind: "student",
    electorId: `agent:${agent.id}`,
    registrationNumber: agent.agentCode,
    fullName: agent.fullName,
    electionId: agent.electionId,
    lastActivityAt: Date.now(),
  });
  return { ok: true, next: "/agent/home" };
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
  const { readElectorSession } = await import("@/lib/elector-session");
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("candidate:")) {
    return { ok: false, error: "Sign in to the Candidate Portal first." };
  }
  const studentId = session.electorId.replace("candidate:", "");
  const store = await readStore();
  const application = store.candidateApplications.find(
    (item) => item.studentId === studentId && item.electionKind === "COUNCIL",
  );
  if (!application) {
    return { ok: false, error: "Agent nomination is available only to SAKU Council candidates." };
  }
  if (!input.fullName.trim() || !input.registrationNumber.trim()) {
    return { ok: false, error: "Enter the nominated agent's name and registration number." };
  }
  const id = `agent-${crypto.randomUUID().slice(0, 8)}`;
  await writeStore((current) => {
    current.agents.push({
      id,
      agentCode: `AG-${String(current.agents.length + 1).padStart(3, "0")}`,
      fullName: input.fullName.trim(),
      registrationNumber: input.registrationNumber.trim(),
      passwordHash: "",
      candidateApplicationId: application.id,
      candidateStudentId: application.studentId,
      candidateName: application.fullName,
      electionId: application.electionId,
      nominationStatus: "NOMINATED",
      accreditationStatus: "PENDING",
      permittedStationIds: [],
      accreditedAt: null,
      accreditedBy: null,
      createdAt: new Date().toISOString(),
    });
    return current;
  });
  await appendAudit({
    actorWorkId: studentId,
    actorName: application.fullName,
    action: "nominate_agent",
    detail: `${application.fullName} nominated ${input.fullName.trim()} as an agent.`,
    highRisk: false,
    entity: "agent",
    entityId: id,
  });
  revalidatePath("/candidate/home");
  revalidatePath("/commission/agents");
  return { ok: true };
}

export async function submitAgentObservation(input: {
  body: string;
  stationId: string;
  evidenceName?: string;
  evidenceType?: string;
}): Promise<ActionResult> {
  const { readElectorSession } = await import("@/lib/elector-session");
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("agent:")) {
    return { ok: false, error: "Sign in to the Agent Portal first." };
  }
  const agentId = session.electorId.replace("agent:", "");
  const store = await readStore();
  const agent = store.agents.find((item) => item.id === agentId);
  if (!agent) return { ok: false, error: "Agent record not found." };
  if (agent.accreditationStatus !== "ACCREDITED") {
    return { ok: false, error: "Only accredited agents may submit observations." };
  }
  if (!agent.permittedStationIds.includes(input.stationId)) {
    return { ok: false, error: "You may only observe your permitted polling station." };
  }
  if (!input.body.trim()) return { ok: false, error: "Enter an observation." };

  const observationId = `obs-${crypto.randomUUID()}`;
  const incidentId = `inc-${crypto.randomUUID()}`;
  const reference = `AGT-${Date.now().toString(36).toUpperCase()}`;
  await writeStore((current) => {
    current.agentObservations.push({
      id: observationId,
      agentId,
      stationId: input.stationId,
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
      linkedIncidentId: incidentId,
    });
    current.incidents.unshift({
      id: incidentId,
      electionId: agent.electionId,
      stationId: input.stationId,
      reportedByWorkId: agent.agentCode,
      reportedByName: agent.fullName,
      reporterRole: "AGENT",
      reporterKind: "agent",
      agentId,
      category: "conduct",
      description: input.body.trim(),
      occurredAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      status: "open",
      evidence: input.evidenceName
        ? [
            {
              id: `ev-${crypto.randomUUID()}`,
              filename: input.evidenceName,
              mimeType: input.evidenceType || "application/octet-stream",
              storedName: input.evidenceName,
              reference: `EVD-${reference}-1`,
              kind: evidenceKind(input.evidenceType ?? "", input.evidenceName),
              uploadedAt: new Date().toISOString(),
              uploadedBy: agent.fullName,
            },
          ]
        : [],
      reference,
    });
    return current;
  });
  revalidatePath("/agent/home");
  revalidatePath("/commission/incidents");
  return { ok: true };
}
