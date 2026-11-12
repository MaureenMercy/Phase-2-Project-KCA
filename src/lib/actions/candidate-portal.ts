"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  activeApplicationOfType,
  agentCapacity,
  applicationWindowState,
  canNominateAgents,
  councilPositionById,
  deriveElectoralCollege,
  duplicateSubmissionError,
  emptyApplication,
  filteredDepartments,
  filteredSchools,
  canEditApplication,
  nominationsForApplication,
  nextApplicationReference,
  nextInvitationReference,
  snapshotIdentityOntoApplication,
  validateSubmission,
  windowForType,
} from "@/lib/candidate-portal";
import {
  clearCandidateSession,
  readCandidateSession,
  requireCandidateSession,
  saveCandidateSession,
} from "@/lib/candidate-session";
import {
  identityByStudentId,
  maskPhone,
  matchStudentIdentity,
  publicIdentityView,
} from "@/lib/identity";
import { issueOtp, peekDemoOtp, verifyOtp } from "@/lib/otp";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import { normalizeStudentId } from "@/lib/student-auth";
import type {
  CandidateApplication,
  CandidateApplicationType,
  CorrectionRequestFieldKey,
  StudentIdentity,
} from "@/lib/types";

export type CandidateActionResult =
  | {
      ok: true;
      next?: string;
      demoOtp?: string | null;
      applicationId?: string;
      reference?: string;
    }
  | { ok: false; error: string; field?: string };

const IdentitySchema = z.object({
  studentId: z
    .string()
    .trim()
    .regex(/^[0-9]{2}\/[0-9]{4,6}$/, "Enter your student registration number, for example 24/01212."),
  nationalId: z
    .string()
    .trim()
    .regex(/^[0-9]{7,8}$/, "Enter the 7 or 8 digit National ID number on your student record."),
  phone: z
    .string()
    .trim()
    .min(10, "Enter the mobile number on your student record.")
    .max(16, "Enter the mobile number on your student record."),
  identityDocumentType: z.string().trim().min(1, "Select an identity document type."),
});

function otpKey(studentId: string) {
  return `candidate:${normalizeStudentId(studentId)}`;
}

function refreshCandidate() {
  revalidatePath("/candidate");
  revalidatePath("/candidate/dashboard");
  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/apply");
  revalidatePath("/candidate/agents");
  revalidatePath("/candidate/notifications");
  revalidatePath("/candidate/profile");
}

function genericIdentityError() {
  return {
    ok: false as const,
    error: "Those details do not match a student record in this demonstration dataset.",
  };
}

export async function startCandidateVerification(input: {
  studentId: string;
  nationalId: string;
  phone: string;
  identityDocumentType: string;
}): Promise<CandidateActionResult> {
  const parsed = IdentitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details you entered." };
  }

  const store = await readStore();
  const allowedType = store.portalConfig.identityDocumentTypes.find(
    (item) => item.id === parsed.data.identityDocumentType && item.enabled,
  );
  if (!allowedType) {
    return {
      ok: false,
      error:
        store.portalConfig.alternativeIdPolicyStatus === "awaiting_commission"
          ? "Only the Kenyan National ID is accepted until the Electoral Commission configures other identity documents."
          : "That identity document type is not accepted.",
    };
  }

  const identity = matchStudentIdentity(store, parsed.data);
  if (!identity) return genericIdentityError();

  await issueOtp(otpKey(identity.studentId));
  await saveCandidateSession({
    kind: "candidate",
    state: "pending_otp",
    studentId: identity.studentId,
    studentIdentityId: identity.id,
    fullName: identity.fullName,
    lastActivityAt: Date.now(),
  });
  await appendAudit({
    actorWorkId: identity.studentId,
    actorName: identity.fullName,
    action: "candidate_identity_challenge",
    detail: "Candidate portal issued a simulated OTP after matching the mock student record.",
    highRisk: false,
    entity: "student_identity",
    entityId: identity.id,
  });
  return { ok: true, next: "/candidate/verify/otp" };
}

export async function getCandidateDemoOtp() {
  const session = await readCandidateSession();
  if (!session || session.state !== "pending_otp") return null;
  return (await peekDemoOtp(otpKey(session.studentId))) ?? (await issueOtp(otpKey(session.studentId)));
}

export async function verifyCandidateOtp(otp: string): Promise<CandidateActionResult> {
  const session = await readCandidateSession();
  if (!session || session.state !== "pending_otp") {
    return { ok: false, error: "Start identity verification again." };
  }
  const code = otp.replace(/\D/g, "");
  if (code.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code sent to your mobile number." };
  }
  const ok = await verifyOtp(otpKey(session.studentId), code);
  if (!ok) {
    return { ok: false, error: "That code is incorrect or has expired. Request a new code and try again." };
  }

  const now = new Date().toISOString();
  await writeStore((store) => {
    const existing = store.candidateProfiles.find(
      (item) => normalizeStudentId(item.studentId) === normalizeStudentId(session.studentId),
    );
    if (!existing) {
      store.candidateProfiles.push({
        id: `cprof-${crypto.randomUUID().slice(0, 8)}`,
        studentId: session.studentId,
        createdAt: now,
        updatedAt: now,
      });
    }
    return store;
  });

  await saveCandidateSession({
    ...session,
    state: "authenticated",
    lastActivityAt: Date.now(),
  });
  await appendAudit({
    actorWorkId: session.studentId,
    actorName: session.fullName,
    action: "candidate_otp_verified",
    detail: "Candidate portal identity was verified with a simulated OTP.",
    highRisk: false,
    entity: "student_identity",
    entityId: session.studentIdentityId,
  });
  refreshCandidate();
  return { ok: true, next: "/candidate/dashboard" };
}

export async function resendCandidateOtp(): Promise<CandidateActionResult> {
  const session = await readCandidateSession();
  if (!session || session.state !== "pending_otp") {
    return { ok: false, error: "Start identity verification again." };
  }
  const demoOtp = await issueOtp(otpKey(session.studentId));
  return { ok: true, demoOtp };
}

export async function logoutCandidate() {
  const session = await readCandidateSession();
  await clearCandidateSession();
  if (session) {
    await appendAudit({
      actorWorkId: session.studentId,
      actorName: session.fullName,
      action: "candidate_logout",
      detail: "Signed out of the Candidate Portal.",
      highRisk: false,
      entity: "student_identity",
      entityId: session.studentIdentityId,
    });
  }
  refreshCandidate();
  redirect("/candidate");
}

function ensureProfile(store: Awaited<ReturnType<typeof readStore>>, identity: StudentIdentity) {
  const existing = store.candidateProfiles.find(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(identity.studentId),
  );
  if (existing) return existing;
  const now = new Date().toISOString();
  const profile = {
    id: `cprof-${crypto.randomUUID().slice(0, 8)}`,
    studentId: identity.studentId,
    createdAt: now,
    updatedAt: now,
  };
  store.candidateProfiles.push(profile);
  return profile;
}

export async function createOrResumeApplication(
  applicationType: CandidateApplicationType,
): Promise<CandidateActionResult> {
  const session = await requireCandidateSession();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId);
  if (!identity) return { ok: false, error: "Your student record could not be loaded." };

  const window = applicationWindowState(windowForType(store.portalConfig, applicationType));
  const existing = activeApplicationOfType(store, session.studentId, applicationType);
  if (existing && existing.status !== "Draft") {
    return {
      ok: true,
      next: `/candidate/applications/${existing.id}`,
      applicationId: existing.id,
    };
  }

  if (!window.open && !existing) {
    return { ok: false, error: window.reason };
  }

  if (existing) {
    return { ok: true, next: `/candidate/apply/${existing.id}`, applicationId: existing.id };
  }

  let createdId = "";
  await writeStore((current) => {
    const profile = ensureProfile(current, identity);
    const now = new Date().toISOString();
    const application = emptyApplication({
      id: `capp-${crypto.randomUUID().slice(0, 8)}`,
      studentId: identity.studentId,
      candidateProfileId: profile.id,
      electionId: current.election.id,
      identity,
      now,
    });
    application.applicationType = applicationType;
    application.currentStep = 3;
    application.electoralCollege = deriveElectoralCollege(current, identity);
    current.candidateApplications.unshift(application);
    createdId = application.id;
    return current;
  });

  await appendAudit({
    actorWorkId: identity.studentId,
    actorName: identity.fullName,
    action: "candidate_application_started",
    detail: `Started a ${applicationType} candidate application.`,
    highRisk: false,
    entity: "candidate_application",
    entityId: createdId,
  });
  refreshCandidate();
  return { ok: true, next: `/candidate/apply/${createdId}`, applicationId: createdId };
}

export async function startBlankApplication(): Promise<CandidateActionResult> {
  const session = await requireCandidateSession();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId);
  if (!identity) return { ok: false, error: "Your student record could not be loaded." };

  const openDraft = store.candidateApplications.find(
    (item) =>
      normalizeStudentId(item.studentId) === normalizeStudentId(session.studentId) &&
      item.status === "Draft" &&
      !item.applicationType,
  );
  if (openDraft) {
    return { ok: true, next: `/candidate/apply/${openDraft.id}`, applicationId: openDraft.id };
  }

  let createdId = "";
  await writeStore((current) => {
    const profile = ensureProfile(current, identity);
    const now = new Date().toISOString();
    const application = emptyApplication({
      id: `capp-${crypto.randomUUID().slice(0, 8)}`,
      studentId: identity.studentId,
      candidateProfileId: profile.id,
      electionId: current.election.id,
      identity,
      now,
    });
    current.candidateApplications.unshift(application);
    createdId = application.id;
    return current;
  });
  refreshCandidate();
  return { ok: true, next: `/candidate/apply/${createdId}`, applicationId: createdId };
}

async function loadOwnedApplication(applicationId: string) {
  const session = await requireCandidateSession();
  const store = await readStore();
  const application = store.candidateApplications.find((item) => item.id === applicationId);
  if (!application || normalizeStudentId(application.studentId) !== normalizeStudentId(session.studentId)) {
    return { ok: false as const, error: "That application was not found." };
  }
  const identity = identityByStudentId(store, session.studentId);
  if (!identity) return { ok: false as const, error: "Your student record could not be loaded." };
  return { ok: true as const, session, store, application, identity };
}

export async function saveApplicationProgress(input: {
  applicationId: string;
  currentStep?: 1 | 2 | 3 | 4 | 5;
  applicationType?: CandidateApplicationType | null;
  councilPositionId?: string | null;
  declarations?: Partial<CandidateApplication["declarations"]>;
}): Promise<CandidateActionResult> {
  const loaded = await loadOwnedApplication(input.applicationId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { application, identity } = loaded;

  if (!canEditApplication(application.status)) {
    return {
      ok: false,
      error: "This application can no longer be edited. Use a correction request if something is wrong.",
    };
  }

  await writeStore((store) => {
    const current = store.candidateApplications.find((item) => item.id === application.id);
    if (!current) return store;
    if (input.applicationType !== undefined && current.status === "Draft") {
      current.applicationType = input.applicationType;
      if (input.applicationType === "DELEGATE") {
        current.councilPositionId = null;
      }
      if (input.applicationType === "SAKU_COUNCIL") {
        current.electoralCollege = deriveElectoralCollege(store, identity);
      }
    }
    if (current.applicationType === "DELEGATE") {
      const next = snapshotIdentityOntoApplication(
        identity,
        current,
        deriveElectoralCollege(store, identity),
      );
      current.campusId = next.campusId;
      current.schoolId = next.schoolId;
      current.departmentId = next.departmentId;
      current.programId = next.programId;
      current.electoralCollege = next.electoralCollege;
      current.councilPositionId = null;
    }
    if (input.councilPositionId !== undefined && current.status === "Draft") {
      const position = councilPositionById(store.portalConfig, input.councilPositionId);
      current.councilPositionId = position?.id ?? null;
    }
    if (input.declarations) {
      current.declarations = { ...current.declarations, ...input.declarations };
    }
    if (input.currentStep) current.currentStep = input.currentStep;
    current.campusId = identity.campusId;
    current.schoolId = identity.schoolId;
    current.departmentId = identity.departmentId;
    current.updatedAt = new Date().toISOString();
    return store;
  });
  refreshCandidate();
  return { ok: true, applicationId: application.id };
}

export async function uploadApplicationFile(input: {
  applicationId: string;
  kind: string;
  filename: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}): Promise<CandidateActionResult> {
  const loaded = await loadOwnedApplication(input.applicationId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { application, store } = loaded;

  if (!canEditApplication(application.status)) {
    return { ok: false, error: "Files cannot be changed after this application has been submitted." };
  }
  if (!input.dataUrl.startsWith("data:") || input.size < 1) {
    return { ok: false, error: "The file could not be read. Try another JPEG, PNG or PDF." };
  }

  const isPhoto = input.kind === "photograph";
  const allowedTypes = isPhoto
    ? store.portalConfig.acceptedPhotoTypes
    : store.portalConfig.acceptedDocumentTypes;
  const maxBytes = isPhoto ? store.portalConfig.maxPhotoBytes : store.portalConfig.maxDocumentBytes;
  if (!allowedTypes.includes(input.mimeType)) {
    return {
      ok: false,
      error: isPhoto
        ? "Photographs must be JPEG or PNG files."
        : "Supporting documents must be JPEG, PNG or PDF files.",
    };
  }
  if (input.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `That file is too large. The maximum size is ${maxMb} MB.` };
  }

  const file = {
    id: `file-${crypto.randomUUID().slice(0, 8)}`,
    kind: input.kind,
    filename: input.filename.slice(0, 120),
    mimeType: input.mimeType,
    size: input.size,
    dataUrl: input.dataUrl,
    uploadedAt: new Date().toISOString(),
  };

  await writeStore((current) => {
    const target = current.candidateApplications.find((item) => item.id === application.id);
    if (!target) return current;
    if (isPhoto) {
      target.photograph = file;
    } else {
      target.documents = [...target.documents.filter((item) => item.kind !== input.kind), file];
    }
    target.updatedAt = new Date().toISOString();
    return current;
  });
  refreshCandidate();
  return { ok: true, applicationId: application.id };
}

export async function removeApplicationFile(input: {
  applicationId: string;
  kind: string;
}): Promise<CandidateActionResult> {
  const loaded = await loadOwnedApplication(input.applicationId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { application } = loaded;
  if (!canEditApplication(application.status)) {
    return { ok: false, error: "Files cannot be changed after this application has been submitted." };
  }
  await writeStore((store) => {
    const target = store.candidateApplications.find((item) => item.id === application.id);
    if (!target) return store;
    if (input.kind === "photograph") target.photograph = null;
    else target.documents = target.documents.filter((item) => item.kind !== input.kind);
    target.updatedAt = new Date().toISOString();
    return store;
  });
  refreshCandidate();
  return { ok: true };
}

export async function submitApplication(applicationId: string): Promise<CandidateActionResult> {
  const loaded = await loadOwnedApplication(applicationId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { application, identity, store, session } = loaded;

  const duplicate = duplicateSubmissionError(application);
  if (duplicate) return { ok: false, error: duplicate };

  const nextApplication: CandidateApplication = {
    ...application,
    campusId: identity.campusId,
    schoolId: identity.schoolId,
    departmentId: identity.departmentId,
    programId: identity.programId,
    electoralCollege:
      application.applicationType === "DELEGATE"
        ? deriveElectoralCollege(store, identity)
        : application.electoralCollege ?? deriveElectoralCollege(store, identity),
  };

  const errors = validateSubmission(store, nextApplication);
  if (errors.length) {
    return { ok: false, error: errors[0].message, field: errors[0].field };
  }

  const year = store.election.year;
  let reference = "";
  await writeStore((current) => {
    const target = current.candidateApplications.find((item) => item.id === application.id);
    if (!target) return current;
    if (target.status !== "Draft" && target.status !== "Awaiting Additional Information") {
      reference = target.reference ?? "";
      return current;
    }
    const already = duplicateSubmissionError(target);
    if (already && target.status !== "Awaiting Additional Information") {
      reference = target.reference ?? "";
      return current;
    }
    const now = new Date().toISOString();
    if (target.status === "Draft") {
      target.reference = nextApplicationReference(current, year);
      target.status = "Submitted";
      target.submittedAt = now;
      target.currentStep = 5;
    } else {
      target.status = "Submitted";
      target.outstandingRequirements = [];
    }
    target.campusId = identity.campusId;
    target.schoolId = identity.schoolId;
    target.departmentId = identity.departmentId;
    target.electoralCollege = nextApplication.electoralCollege;
    target.updatedAt = now;
    reference = target.reference ?? "";
    current.portalNotifications.unshift({
      id: `pn-${crypto.randomUUID().slice(0, 8)}`,
      studentId: identity.studentId,
      title: target.status === "Submitted" ? "Application received" : "Update received",
      body: `Application ${reference} has been sent. This is not an approval decision.`,
      createdAt: now,
      read: false,
      href: `/candidate/applications/${target.id}`,
    });
    return current;
  });

  await appendAudit({
    actorWorkId: session.studentId,
    actorName: session.fullName,
    action: "candidate_application_submitted",
    detail: `Submitted candidate application ${reference}.`,
    highRisk: true,
    entity: "candidate_application",
    entityId: application.id,
    newValue: "Submitted",
  });
  refreshCandidate();
  return {
    ok: true,
    next: `/candidate/submitted/${application.id}`,
    applicationId: application.id,
    reference,
  };
}

export async function requestRecordCorrection(input: {
  applicationId?: string;
  field: CorrectionRequestFieldKey;
  requestedValue: string;
  reason: string;
}): Promise<CandidateActionResult> {
  const session = await requireCandidateSession();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId);
  if (!identity) return { ok: false, error: "Your student record could not be loaded." };

  const reason = input.reason.trim();
  if (reason.length < 8) {
    return { ok: false, error: "Explain what needs to be corrected so the Commission can review it." };
  }

  const requestedValue = input.requestedValue.trim();
  let currentValue = "";

  if (input.field === "campusId") {
    const campus = store.campuses.find((item) => item.id === requestedValue && item.status === "active");
    if (!campus) return { ok: false, error: "Choose a campus from the official list." };
    currentValue = identity.campusId;
  } else if (input.field === "schoolId") {
    const school = filteredSchools(store, identity.campusId).find((item) => item.id === requestedValue);
    if (!school) {
      return { ok: false, error: "Choose a school that belongs to your campus." };
    }
    currentValue = identity.schoolId;
  } else if (input.field === "departmentId") {
    const allowed = filteredDepartments(store, identity.schoolId);
    if (!allowed.length) {
      return {
        ok: false,
        error: "This campus does not use department lists. Describe the correction in the reason instead.",
      };
    }
    if (!allowed.some((item) => item.id === requestedValue)) {
      return { ok: false, error: "Choose a department that belongs to your school." };
    }
    currentValue = identity.departmentId ?? "";
  } else if (input.field === "fullName") {
    if (requestedValue.length < 3) return { ok: false, error: "Enter the name that should appear on your record." };
    currentValue = identity.fullName;
  } else if (input.field === "phoneNumber") {
    if (requestedValue.replace(/\D/g, "").length < 10) {
      return { ok: false, error: "Enter the new mobile number. A Commission review is required before it can change." };
    }
    currentValue = identity.phoneNumber;
  } else {
    currentValue = identity.programmeLabel;
    if (requestedValue.length < 3) return { ok: false, error: "Describe the programme that should appear." };
  }

  const now = new Date().toISOString();
  await writeStore((current) => {
    current.correctionRequests.unshift({
      id: `corr-${crypto.randomUUID().slice(0, 8)}`,
      studentId: identity.studentId,
      applicationId: input.applicationId ?? null,
      field: input.field,
      currentValue,
      requestedValue,
      reason,
      status: "submitted",
      createdAt: now,
    });
    current.portalNotifications.unshift({
      id: `pn-${crypto.randomUUID().slice(0, 8)}`,
      studentId: identity.studentId,
      title: "Correction request received",
      body: "Your request to correct verified information has been sent to the Electoral Commission. You cannot change that information yourself.",
      createdAt: now,
      read: false,
      href: "/candidate/profile",
    });
    return current;
  });
  await appendAudit({
    actorWorkId: identity.studentId,
    actorName: identity.fullName,
    action: "candidate_correction_requested",
    detail: `Requested a correction to ${input.field}.`,
    highRisk: false,
    entity: "student_identity",
    entityId: identity.id,
  });
  refreshCandidate();
  return { ok: true };
}

export async function nominateAgent(input: {
  applicationId: string;
  studentId: string;
}): Promise<CandidateActionResult> {
  const loaded = await loadOwnedApplication(input.applicationId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { application, store, identity } = loaded;

  if (!canNominateAgents(application)) {
    return {
      ok: false,
      error: "Agent invitations are available only after a SAKU Council application is approved.",
    };
  }

  const parsedId = z
    .string()
    .trim()
    .regex(/^[0-9]{2}\/[0-9]{4,6}$/, "Enter the proposed agent’s student registration number.")
    .safeParse(input.studentId);
  if (!parsedId.success) {
    return { ok: false, error: parsedId.error.issues[0]?.message ?? "Enter a student registration number." };
  }

  if (normalizeStudentId(parsedId.data) === normalizeStudentId(identity.studentId)) {
    return { ok: false, error: "You cannot nominate yourself as an election agent." };
  }

  const proposed = identityByStudentId(store, parsedId.data);
  if (!proposed) {
    return { ok: false, error: "No matching student was found. Check the registration number." };
  }

  const active = nominationsForApplication(store, application.id);
  const capacity = agentCapacity(store.portalConfig, active);
  if (capacity.remaining < 1) {
    return {
      ok: false,
      error: `The Electoral Commission currently allows ${capacity.max} agent${capacity.max === 1 ? "" : "s"} for this candidacy.`,
    };
  }
  if (
    active.some(
      (item) => normalizeStudentId(item.proposedStudentId) === normalizeStudentId(proposed.studentId),
    )
  ) {
    return { ok: false, error: "That student already has an open invitation for this candidacy." };
  }

  let invitationReference = "";
  await writeStore((current) => {
    invitationReference = nextInvitationReference(current, current.election.year);
    current.agentNominations.unshift({
      id: `agn-${crypto.randomUUID().slice(0, 8)}`,
      invitationReference,
      candidateApplicationId: application.id,
      nominatingStudentId: identity.studentId,
      proposedStudentId: proposed.studentId,
      proposedFullName: proposed.fullName,
      proposedPhoneMasked: maskPhone(proposed.phoneNumber),
      agentRegistrationComplete: false,
      accreditationStatus: "not_accredited",
      status: "invited",
      createdAt: new Date().toISOString(),
    });
    current.portalNotifications.unshift({
      id: `pn-${crypto.randomUUID().slice(0, 8)}`,
      studentId: identity.studentId,
      title: "Agent invitation sent",
      body: `Invitation ${invitationReference} was sent to ${proposed.fullName}. An invitation does not accredit the agent.`,
      createdAt: new Date().toISOString(),
      read: false,
      href: "/candidate/agents",
    });
    return current;
  });
  await appendAudit({
    actorWorkId: identity.studentId,
    actorName: identity.fullName,
    action: "candidate_agent_nominated",
    detail: `Nominated ${proposed.fullName} (${proposed.studentId}) as an election agent. Invitation ${invitationReference}.`,
    highRisk: false,
    entity: "agent_nomination",
    entityId: invitationReference,
  });
  refreshCandidate();
  return { ok: true, reference: invitationReference };
}

export async function withdrawAgentNomination(nominationId: string): Promise<CandidateActionResult> {
  const session = await requireCandidateSession();
  await writeStore((store) => {
    const nomination = store.agentNominations.find((item) => item.id === nominationId);
    if (
      !nomination ||
      normalizeStudentId(nomination.nominatingStudentId) !== normalizeStudentId(session.studentId)
    ) {
      return store;
    }
    if (nomination.accreditationStatus === "accredited") return store;
    nomination.status = "withdrawn";
    return store;
  });
  refreshCandidate();
  return { ok: true };
}

export async function markPortalNotificationRead(id: string) {
  const session = await requireCandidateSession();
  await writeStore((store) => {
    const item = store.portalNotifications.find(
      (notification) =>
        notification.id === id &&
        normalizeStudentId(notification.studentId) === normalizeStudentId(session.studentId),
    );
    if (item) item.read = true;
    return store;
  });
  refreshCandidate();
}

export async function loadCandidateContext() {
  const session = await requireCandidateSession();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId);
  if (!identity) return null;
  return {
    session,
    store,
    identity,
    publicIdentity: publicIdentityView(store, identity),
  };
}
