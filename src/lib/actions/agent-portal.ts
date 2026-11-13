"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import {
  agentMayAccessStation,
  agentStudentId,
  candidateHasCapacity,
  denyForbiddenAgentAction,
  evaluateInvitation,
  findInvitation,
  isAccredited,
  lockedReason,
  type AgentForbiddenAction,
} from "@/lib/agent-access";
import {
  clearAgentPortalSession,
  clearAgentRegistration,
  readAgentFromSession,
  readAgentRegistration,
  saveAgentRegistration,
} from "@/lib/agent-session";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { saveElectorSession } from "@/lib/elector-session";
import { evidenceKind } from "@/lib/incidents";
import { identityLast4 } from "@/lib/identity-crypto";
import { issueOtp, peekDemoOtp, verifyOtp } from "@/lib/otp";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import { normalizeStudentId } from "@/lib/student-auth";
import {
  findStudentIdentity,
  publicStudentIdentity,
  verifyPresentedIdentity,
} from "@/lib/student-identity";
import type {
  AgentInvitation,
  AgentNotification,
  AgentRecord,
  IdentityDocumentType,
  IncidentRecord,
} from "@/lib/types";

function catalogues(store: Awaited<ReturnType<typeof readStore>>) {
  return {
    campuses: store.campuses,
    schools: store.schools,
    departments: store.departments,
  };
}

function nextAgentCode(agents: AgentRecord[]) {
  const nums = agents
    .map((item) => Number(item.agentCode.replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));
  return `AG-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

function applicationReference() {
  return `AGA-${Date.now().toString(36).toUpperCase()}`;
}

function invitationReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 6; i += 1) token += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `INV-${token}`;
}

function revalidateAgent() {
  revalidatePath("/agent");
  revalidatePath("/agent/home");
  revalidatePath("/candidate/home");
  revalidatePath("/commission/agents");
  revalidatePath("/commission/incidents");
}

function pushNote(
  store: { agentNotifications: AgentNotification[] },
  note: Omit<AgentNotification, "id" | "createdAt" | "read"> & { createdAt?: string },
) {
  store.agentNotifications.unshift({
    id: `an-${crypto.randomUUID()}`,
    createdAt: note.createdAt ?? new Date().toISOString(),
    read: false,
    ...note,
  });
}

async function signInAgent(agent: AgentRecord) {
  await saveElectorSession({
    kind: "student",
    electorId: `agent:${agent.id}`,
    registrationNumber: agent.studentId || agent.registrationNumber,
    fullName: agent.fullName,
    electionId: agent.electionId,
    lastActivityAt: Date.now(),
  });
  await clearAgentRegistration();
}

export async function startAgentIdentityVerification(input: {
  studentId: string;
  documentType: IdentityDocumentType;
  nationalId: string;
  phone: string;
}): Promise<ActionResult & { fullName?: string; demoOtp?: string | null; phone?: string }> {
  const store = await readStore();
  const student = findStudentIdentity(store.studentElectors, input.studentId);
  if (!student) {
    return {
      ok: false,
      error:
        "That registration number is not in the mock student identity dataset. Check the number, or ask the Commission help desk.",
    };
  }
  if (!verifyPresentedIdentity(student, input.nationalId)) {
    return {
      ok: false,
      error:
        "The identity document does not match the verified student record. The name and academic details cannot be retrieved until identity is confirmed.",
    };
  }
  const phone = input.phone.trim() || student.phone || "";
  if (!/^0[17]\d{8}$/.test(phone.replace(/\s+/g, ""))) {
    return { ok: false, error: "Enter a Kenyan mobile number starting with 07 or 01." };
  }
  const otpKey = `agent-reg:${normalizeStudentId(student.studentId)}`;
  const demoOtp = await issueOtp(otpKey);
  return {
    ok: true,
    fullName: student.fullName,
    phone,
    demoOtp: (await peekDemoOtp(otpKey)) ?? demoOtp,
  };
}

export async function confirmAgentIdentityOtp(input: {
  studentId: string;
  otp: string;
  phone: string;
  documentType: IdentityDocumentType;
  nationalId: string;
}): Promise<ActionResult> {
  const store = await readStore();
  const student = findStudentIdentity(store.studentElectors, input.studentId);
  if (!student) return { ok: false, error: "Student identity was not found." };
  if (!verifyPresentedIdentity(student, input.nationalId)) {
    return { ok: false, error: "Identity details changed. Start verification again." };
  }
  const otpKey = `agent-reg:${normalizeStudentId(student.studentId)}`;
  const ok = await verifyOtp(otpKey, input.otp);
  if (!ok) return { ok: false, error: "That one-time code is incorrect or has expired. Request a new code." };
  await saveAgentRegistration({
    studentId: student.studentId,
    fullName: student.fullName,
    phone: input.phone.trim(),
    documentType: input.documentType,
    nationalIdLast4: identityLast4(input.nationalId),
    phoneVerified: true,
  });
  return { ok: true };
}

export async function bindAgentInvitation(reference: string): Promise<ActionResult> {
  const draft = await readAgentRegistration();
  if (!draft?.phoneVerified) {
    return { ok: false, error: "Verify your student identity and phone number before entering an invitation." };
  }
  const store = await readStore();
  const invitation = findInvitation(store, reference);
  const candidate = invitation
    ? store.candidateApplications.find((item) => item.id === invitation.candidateApplicationId)
    : null;
  const evaluation = evaluateInvitation({
    invitation,
    studentId: draft.studentId,
    candidate,
    store,
  });
  if (!evaluation.ok) return { ok: false, error: evaluation.message };
  await saveAgentRegistration({
    ...draft,
    invitationId: evaluation.invitation.id,
    invitationReference: evaluation.invitation.reference,
  });
  return { ok: true };
}

function buildAgentFromDraft(input: {
  store: Awaited<ReturnType<typeof readStore>>;
  draft: NonNullable<Awaited<ReturnType<typeof readAgentRegistration>>>;
  invitation: AgentInvitation;
  requestedStationId: string;
  correctionRequest: string;
  submit: boolean;
  acknowledgements: { conduct: boolean; accuracy: boolean; privacy: boolean };
}): AgentRecord {
  const station = input.store.pollingStations.find((item) => item.id === input.requestedStationId);
  const existing = input.store.agents.find(
    (item) => agentStudentId(item) === normalizeStudentId(input.draft.studentId),
  );
  const nowIso = new Date().toISOString();
  return {
    id: existing?.id ?? `agent-${crypto.randomUUID().slice(0, 8)}`,
    agentCode: existing?.agentCode ?? nextAgentCode(input.store.agents),
    studentId: input.draft.studentId,
    fullName: input.draft.fullName,
    registrationNumber: input.draft.studentId,
    passwordHash: existing?.passwordHash ?? "",
    phone: input.draft.phone,
    phoneVerifiedAt: nowIso,
    invitationId: input.invitation.id,
    invitationReference: input.invitation.reference,
    applicationReference: existing?.applicationReference ?? applicationReference(),
    applicationStatus: input.submit ? "SUBMITTED" : "DRAFT",
    candidateApplicationId: input.invitation.candidateApplicationId,
    candidateStudentId: input.invitation.candidateStudentId,
    candidateName: input.invitation.candidateName,
    candidatePosition: input.invitation.candidatePosition,
    candidatePhoto: input.invitation.candidatePhoto,
    electionId: input.invitation.electionId,
    nominationStatus: "NOMINATED",
    accreditationStatus: "PENDING",
    accreditationReference: null,
    requestedCampusId: station?.campusId ?? null,
    requestedStationId: station?.id ?? null,
    assignedCampusId: null,
    assignedStationId: null,
    permittedStationIds: [],
    accessInstructions:
      "Requested station access is subject to Electoral Commission approval. Selecting a station does not grant access.",
    conductAcknowledged: input.acknowledgements.conduct,
    accuracyConfirmed: input.acknowledgements.accuracy,
    privacyAcknowledged: input.acknowledgements.privacy,
    correctionRequest: input.correctionRequest.trim() || null,
    correctionRequestAt: input.correctionRequest.trim() ? nowIso : null,
    submittedAt: input.submit ? nowIso : null,
    accreditedAt: null,
    accreditedBy: null,
    decisionNote: null,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
}

async function persistApplication(input: {
  requestedStationId: string;
  correctionRequest?: string;
  submit: boolean;
  conduct?: boolean;
  accuracy?: boolean;
  privacy?: boolean;
}): Promise<ActionResult> {
  const draft = await readAgentRegistration();
  if (!draft?.phoneVerified || !draft.invitationId) {
    return { ok: false, error: "Complete identity verification and invitation validation first." };
  }
  if (input.submit && (!input.conduct || !input.accuracy || !input.privacy)) {
    return {
      ok: false,
      error: "Confirm the Agent Code of Conduct, the accuracy declaration and the privacy notice before submitting.",
    };
  }
  if (!input.requestedStationId) {
    return { ok: false, error: "Select the campus polling station you are requesting to observe." };
  }

  const store = await readStore();
  const invitation = store.agentInvitations.find((item) => item.id === draft.invitationId);
  const candidate = invitation
    ? store.candidateApplications.find((item) => item.id === invitation.candidateApplicationId)
    : null;
  const evaluation = evaluateInvitation({
    invitation,
    studentId: draft.studentId,
    candidate,
    store,
  });
  if (!evaluation.ok) return { ok: false, error: evaluation.message };

  const duplicate = store.agents.find(
    (item) =>
      agentStudentId(item) === normalizeStudentId(draft.studentId) &&
      item.applicationStatus !== "DRAFT" &&
      item.accreditationStatus !== "DECLINED",
  );
  if (duplicate && duplicate.invitationId !== invitation?.id) {
    return { ok: false, error: "This student already has an agent application linked to the shared identity record." };
  }

  const agent = buildAgentFromDraft({
    store,
    draft,
    invitation: evaluation.invitation,
    requestedStationId: input.requestedStationId,
    correctionRequest: input.correctionRequest ?? "",
    submit: input.submit,
    acknowledgements: {
      conduct: Boolean(input.conduct),
      accuracy: Boolean(input.accuracy),
      privacy: Boolean(input.privacy),
    },
  });

  await writeStore((current) => {
    current.agentInvitations = current.agentInvitations.map((item) =>
      item.id === evaluation.invitation.id && input.submit
        ? {
            ...item,
            status: "USED",
            usedAt: new Date().toISOString(),
            usedByApplicationId: agent.id,
          }
        : item,
    );
    const index = current.agents.findIndex((item) => item.id === agent.id);
    if (index >= 0) current.agents[index] = agent;
    else current.agents.push(agent);
    if (input.submit) {
      pushNote(current, {
        agentId: agent.id,
        studentId: agent.studentId,
        title: "Application received",
        body: `Application ${agent.applicationReference} was submitted. The Electoral Commission will review identity and nomination. Accreditation is not automatic.`,
        href: "/agent/accreditation",
        kind: "application",
      });
    }
    return current;
  });

  await signInAgent(agent);
  await appendAudit({
    actorWorkId: agent.studentId,
    actorName: agent.fullName,
    action: input.submit ? "submit_agent_application" : "save_agent_application_draft",
    detail: `${agent.fullName} ${input.submit ? "submitted" : "saved"} agent application ${agent.applicationReference}.`,
    highRisk: false,
    entity: "agent",
    entityId: agent.id,
  });
  revalidateAgent();
  return { ok: true, next: "/agent/home" };
}

export async function saveAgentApplicationDraft(input: {
  requestedStationId: string;
  correctionRequest?: string;
}): Promise<ActionResult> {
  return persistApplication({ ...input, submit: false });
}

export async function submitAgentApplication(input: {
  requestedStationId: string;
  correctionRequest?: string;
  conduct: boolean;
  accuracy: boolean;
  privacy: boolean;
}): Promise<ActionResult> {
  return persistApplication({ ...input, submit: true });
}

export async function requestAgentLoginOtp(input: {
  studentId: string;
}): Promise<ActionResult & { demoOtp?: string | null }> {
  const store = await readStore();
  const key = normalizeStudentId(input.studentId);
  const agent =
    store.agents.find((item) => agentStudentId(item) === key || item.agentCode.toUpperCase() === key) ?? null;
  const student = findStudentIdentity(store.studentElectors, key) ?? (agent
    ? findStudentIdentity(store.studentElectors, agent.studentId)
    : null);
  if (!agent && !student) {
    return { ok: false, error: "No agent application or student identity matches that registration number." };
  }
  const otpKey = `agent-login:${agent ? agentStudentId(agent) : normalizeStudentId(student!.studentId)}`;
  const demoOtp = await issueOtp(otpKey);
  return { ok: true, demoOtp: (await peekDemoOtp(otpKey)) ?? demoOtp };
}

export async function completeAgentLogin(input: {
  studentId: string;
  otp: string;
}): Promise<ActionResult> {
  const store = await readStore();
  const key = normalizeStudentId(input.studentId);
  const agent =
    store.agents.find((item) => agentStudentId(item) === key || item.agentCode.toUpperCase() === key) ?? null;
  if (!agent) {
    return {
      ok: false,
      error: "There is no agent application for that student yet. Register with a candidate invitation first.",
    };
  }
  const otpKey = `agent-login:${agentStudentId(agent)}`;
  const otpOk = await verifyOtp(otpKey, input.otp);
  if (!otpOk && input.otp !== DEMO_PASSWORD && input.otp !== "202026") {
    return { ok: false, error: "That one-time code is incorrect or has expired." };
  }
  await signInAgent(agent);
  return { ok: true, next: "/agent/home" };
}

export async function logoutAgentPortal(): Promise<ActionResult> {
  await clearAgentPortalSession();
  return { ok: true, next: "/agent" };
}

export async function requestAcademicCorrection(note: string): Promise<ActionResult> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  if (!note.trim()) return { ok: false, error: "Describe the correction the Commission should review." };
  await writeStore((store) => {
    store.agents = store.agents.map((item) =>
      item.id === agent.id
        ? { ...item, correctionRequest: note.trim(), correctionRequestAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : item,
    );
    return store;
  });
  revalidateAgent();
  return { ok: true };
}

export async function agentCheckIn(): Promise<ActionResult> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  const blocked = lockedReason(agent, "checkIn");
  if (blocked) return { ok: false, error: blocked };
  const stationId = agent.assignedStationId || agent.permittedStationIds[0];
  if (!stationId || !agentMayAccessStation(agent, stationId)) {
    return { ok: false, error: "You are not authorised to check in at a polling station until the Commission assigns one." };
  }
  await writeStore((store) => {
    const open = store.agentAttendance.find((item) => item.agentId === agent.id && !item.checkOutAt);
    if (open) return store;
    store.agentAttendance.push({
      id: `att-${crypto.randomUUID()}`,
      agentId: agent.id,
      stationId,
      checkInAt: new Date().toISOString(),
      checkOutAt: null,
      recordedBy: agent.fullName,
    });
    return store;
  });
  await appendAudit({
    actorWorkId: agent.studentId,
    actorName: agent.fullName,
    action: "agent_self_checkin",
    detail: `${agent.agentCode} checked in at ${stationId}.`,
    highRisk: false,
    stationId,
    entity: "agent",
    entityId: agent.id,
  });
  revalidateAgent();
  return { ok: true };
}

export async function agentCheckOut(): Promise<ActionResult> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  const blocked = lockedReason(agent, "checkIn");
  if (blocked) return { ok: false, error: blocked };
  await writeStore((store) => {
    store.agentAttendance = store.agentAttendance.map((item) =>
      item.agentId === agent.id && !item.checkOutAt
        ? { ...item, checkOutAt: new Date().toISOString(), recordedBy: agent.fullName }
        : item,
    );
    return store;
  });
  revalidateAgent();
  return { ok: true };
}

export async function attemptUnauthorizedStationCheckIn(stationId: string): Promise<ActionResult> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  if (!agentMayAccessStation(agent, stationId)) {
    return { ok: false, error: "You may only check in at the polling station assigned by the Electoral Commission." };
  }
  return agentCheckIn();
}

export async function submitAgentObservationRecord(input: {
  category: "process" | "technical" | "security" | "conduct" | "other";
  body: string;
  stationId: string;
  occurredAt: string;
  evidenceName?: string;
  evidenceType?: string;
}): Promise<ActionResult> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  const blocked = lockedReason(agent, "observe");
  if (blocked) return { ok: false, error: blocked };
  if (!agentMayAccessStation(agent, input.stationId)) {
    return { ok: false, error: "You may only record observations for your assigned polling station." };
  }
  if (!input.body.trim()) return { ok: false, error: "Describe what you observed." };
  const observationId = `obs-${crypto.randomUUID()}`;
  await writeStore((store) => {
    store.agentObservations.unshift({
      id: observationId,
      agentId: agent.id,
      stationId: input.stationId,
      category: input.category,
      body: input.body.trim(),
      occurredAt: input.occurredAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      linkedIncidentId: null,
      evidenceName: input.evidenceName,
      evidenceType: input.evidenceType,
    });
    return store;
  });
  revalidateAgent();
  return { ok: true };
}

export async function submitAgentIncidentReport(input: {
  category: IncidentRecord["category"];
  description: string;
  stationId: string;
  occurredAt: string;
  evidenceName?: string;
  evidenceType?: string;
}): Promise<ActionResult & { reference?: string }> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  const blocked = lockedReason(agent, "reportIncident");
  if (blocked) return { ok: false, error: blocked };
  if (!isAccredited(agent) || !agentMayAccessStation(agent, input.stationId)) {
    return { ok: false, error: "Only accredited agents may submit incident reports for their assigned station." };
  }
  if (!input.description.trim()) return { ok: false, error: "Describe the incident." };

  const observationId = `obs-${crypto.randomUUID()}`;
  const incidentId = `inc-${crypto.randomUUID()}`;
  const reference = `AGT-${Date.now().toString(36).toUpperCase()}`;
  const nowIso = new Date().toISOString();
  await writeStore((store) => {
    store.agentObservations.unshift({
      id: observationId,
      agentId: agent.id,
      stationId: input.stationId,
      category: input.category,
      body: input.description.trim(),
      occurredAt: input.occurredAt || nowIso,
      createdAt: nowIso,
      linkedIncidentId: incidentId,
      evidenceName: input.evidenceName,
      evidenceType: input.evidenceType,
    });
    store.incidents.unshift({
      id: incidentId,
      electionId: agent.electionId,
      stationId: input.stationId,
      reportedByWorkId: agent.agentCode,
      reportedByName: agent.fullName,
      reporterRole: "AGENT",
      reporterKind: "agent",
      agentId: agent.id,
      category: input.category,
      description: input.description.trim(),
      occurredAt: input.occurredAt || nowIso,
      recordedAt: nowIso,
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
              uploadedAt: nowIso,
              uploadedBy: agent.fullName,
            },
          ]
        : [],
      reference,
    });
    pushNote(store, {
      agentId: agent.id,
      studentId: agent.studentId,
      title: "Incident report received",
      body: `Report ${reference} was sent to the Electoral Commission. You can track its status, but you cannot classify or close it.`,
      href: "/agent/reports",
      kind: "report",
    });
    return store;
  });
  await appendAudit({
    actorWorkId: agent.agentCode,
    actorName: agent.fullName,
    action: "agent_incident_report",
    detail: `${agent.fullName} submitted incident ${reference}.`,
    highRisk: false,
    stationId: input.stationId,
    entity: "incident",
    entityId: incidentId,
  });
  revalidateAgent();
  return { ok: true, reference };
}

export async function markAgentNotificationRead(id: string): Promise<ActionResult> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  await writeStore((store) => {
    store.agentNotifications = store.agentNotifications.map((item) =>
      item.id === id && (item.agentId === agent.id || item.studentId === agent.studentId)
        ? { ...item, read: true }
        : item,
    );
    return store;
  });
  revalidatePath("/agent/notifications");
  revalidatePath("/agent/home");
  return { ok: true };
}

export async function attemptForbiddenAgentAction(action: AgentForbiddenAction): Promise<ActionResult> {
  return denyForbiddenAgentAction(action);
}

export async function attemptReadOtherAgentReports(targetAgentId: string): Promise<ActionResult> {
  const agent = await readAgentFromSession();
  if (!agent) return { ok: false, error: "Sign in to the Agent Portal first." };
  if (targetAgentId !== agent.id) return denyForbiddenAgentAction("view_other_agent_reports");
  return { ok: true };
}

export async function inviteAgentAsCandidate(input: {
  invitedStudentId: string;
}): Promise<ActionResult & { reference?: string }> {
  const { readElectorSession } = await import("@/lib/elector-session");
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("candidate:")) {
    return { ok: false, error: "Sign in to the Candidate Portal first." };
  }
  const studentId = session.electorId.replace("candidate:", "");
  const store = await readStore();
  const application = store.candidateApplications.find(
    (item) => item.studentId === studentId && item.electionKind === "COUNCIL" && item.vettingStatus === "APPROVED",
  );
  if (!application) {
    return { ok: false, error: "Only an approved SAKU Council candidate may nominate an agent." };
  }
  const invited = findStudentIdentity(store.studentElectors, input.invitedStudentId);
  if (!invited) {
    return { ok: false, error: "That registration number is not in the shared student identity record." };
  }
  if (normalizeStudentId(invited.studentId) === normalizeStudentId(application.studentId)) {
    return { ok: false, error: "You cannot nominate yourself as your own election agent." };
  }
  if (!candidateHasCapacity(store, application.id)) {
    return {
      ok: false,
      error: `This ticket already has the Commission maximum of ${store.agentPolicy.maxAgentsPerCandidate} agents.`,
    };
  }
  const already = store.agentInvitations.find(
    (item) =>
      item.candidateApplicationId === application.id &&
      normalizeStudentId(item.invitedStudentId) === normalizeStudentId(invited.studentId) &&
      (item.status === "OPEN" || item.status === "USED"),
  );
  if (already) {
    return { ok: false, error: `An invitation for this student already exists (${already.reference}).` };
  }

  const id = `inv-${crypto.randomUUID().slice(0, 8)}`;
  const reference = invitationReference();
  const snapshot = publicStudentIdentity(invited, catalogues(store));
  await writeStore((current) => {
    current.agentInvitations.unshift({
      id,
      reference,
      candidateApplicationId: application.id,
      candidateStudentId: application.studentId,
      candidateName: application.fullName,
      candidatePosition: application.positionLabel,
      candidatePhoto: application.photo,
      electionId: application.electionId,
      invitedStudentId: invited.studentId,
      invitedFullName: invited.fullName,
      status: "OPEN",
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      usedAt: null,
      usedByApplicationId: null,
      revokedAt: null,
      revokedReason: null,
    });
    pushNote(current, {
      agentId: "",
      studentId: invited.studentId,
      title: "You have been nominated",
      body: `${application.fullName} nominated you as an election agent. Use invitation ${reference} in the Agent Portal. Academic details shown to you will come from the verified record for ${snapshot.fullName}.`,
      href: "/agent/register",
      kind: "invitation",
    });
    return current;
  });
  await appendAudit({
    actorWorkId: studentId,
    actorName: application.fullName,
    action: "invite_agent",
    detail: `${application.fullName} invited ${invited.fullName} with ${reference}.`,
    highRisk: false,
    entity: "agent_invitation",
    entityId: id,
  });
  revalidateAgent();
  return { ok: true, reference };
}

export async function revokeAgentInvitation(invitationId: string): Promise<ActionResult> {
  const { readElectorSession } = await import("@/lib/elector-session");
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("candidate:")) {
    return { ok: false, error: "Sign in to the Candidate Portal first." };
  }
  const studentId = session.electorId.replace("candidate:", "");
  await writeStore((store) => {
    store.agentInvitations = store.agentInvitations.map((item) =>
      item.id === invitationId && item.candidateStudentId === studentId && item.status === "OPEN"
        ? {
            ...item,
            status: "REVOKED",
            revokedAt: new Date().toISOString(),
            revokedReason: "Withdrawn by the nominating candidate.",
          }
        : item,
    );
    return store;
  });
  revalidateAgent();
  return { ok: true };
}
