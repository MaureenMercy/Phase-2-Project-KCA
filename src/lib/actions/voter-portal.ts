"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/auth";
import { departmentsForSchool, programmesForDepartment, schoolsForCampus } from "@/lib/academic";
import { clearElectorSession, readElectorSession, saveElectorSession } from "@/lib/elector-session";
import { unitForStudent } from "@/lib/electoral";
import { encryptNationalId } from "@/lib/identity-crypto";
import {
  isDocumentTypeAllowed,
  last4,
  maskPhone,
  nationalIdMatches,
  normalizeNationalId,
} from "@/lib/identity";
import { issueOtp, peekDemoOtp, verifyOtp } from "@/lib/otp";
import { ELECTION_1_ID } from "@/lib/seed-electorate";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { normalizeStudentId, pinMatchesStudent, SEEDED_STUDENT_PIN } from "@/lib/student-auth";
import type { AccessibilityCategory, AccessibilityProfile, AppStore, StudentElector, VoterProfile } from "@/lib/types";
import {
  buildHistoryEvent,
  canContinueDraft,
  emptyVoterDraft,
  newVoterReference,
  phoneOtpKey,
  registrationBlocksDuplicate,
  studentPhone,
  voterProfileFor,
} from "@/lib/voter";

export type VoterActionResult = ActionResult & {
  demoOtp?: string | null;
  support?: boolean;
  reference?: string;
  next?: string;
};

function voterSessionStudentId(electorId?: string | null) {
  if (!electorId?.startsWith("voter:")) return null;
  return electorId.replace("voter:", "");
}

async function requireVoterStudent(): Promise<
  { ok: true; studentId: string; store: AppStore; student: StudentElector; profile: VoterProfile | null } | VoterActionResult
> {
  const session = await readElectorSession();
  const studentId = voterSessionStudentId(session?.electorId);
  if (!studentId) return { ok: false, error: "Sign in to the Voter Portal first." };
  const store = await readStore();
  const student = store.studentElectors.find((item) => item.studentId === studentId);
  if (!student) return { ok: false, error: "Your student record is no longer available. Contact support." };
  return { ok: true, studentId, store, student, profile: voterProfileFor(store, studentId) };
}

async function openVoterSession(student: StudentElector) {
  await saveElectorSession({
    kind: "student",
    electorId: `voter:${student.studentId}`,
    registrationNumber: student.studentId,
    fullName: student.fullName,
    electionId: ELECTION_1_ID,
    lastActivityAt: Date.now(),
  });
}

function revalidateVoter() {
  revalidatePath("/voter");
  revalidatePath("/voter/home");
  revalidatePath("/voter/register");
  revalidatePath("/voter/registration");
  revalidatePath("/voter/eligibility");
  revalidatePath("/voter/accessibility");
  revalidatePath("/voter/history");
  revalidatePath("/voter/profile");
  revalidatePath("/voter/notifications");
  revalidatePath("/voter/help");
  revalidatePath("/commission/voters");
}

function upsertProfile(store: AppStore, profile: VoterProfile) {
  const index = store.voterProfiles.findIndex((item) => item.studentId === profile.studentId);
  if (index >= 0) store.voterProfiles[index] = profile;
  else store.voterProfiles.push(profile);
}

function pushHistory(store: AppStore, event: ReturnType<typeof buildHistoryEvent>) {
  store.voterHistory = [event, ...store.voterHistory].slice(0, 400);
}

function notify(store: AppStore, studentId: string, title: string, body: string, href: string) {
  store.voterNotifications = [
    {
      id: `vn-${crypto.randomUUID()}`,
      studentId,
      title,
      body,
      href,
      read: false,
      createdAt: new Date().toISOString(),
    },
    ...store.voterNotifications,
  ].slice(0, 200);
}

export async function voterPortalLogin(input: { studentId: string; pin: string }): Promise<VoterActionResult> {
  const store = await readStore();
  const student = store.studentElectors.find(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(input.studentId),
  );
  const pin = input.pin.trim();
  const pinOk =
    pin === SEEDED_STUDENT_PIN ||
    pin === DEMO_PASSWORD ||
    (await pinMatchesStudent({ pin, enrolledPasswordHash: null }));
  if (!student || !pinOk) {
    return { ok: false, error: "Student ID or PIN is incorrect." };
  }
  const profile = voterProfileFor(store, student.studentId);
  await openVoterSession(student);
  if (!profile) return { ok: true, next: "/voter/register" };
  if (canContinueDraft(profile)) return { ok: true, next: "/voter/register" };
  return { ok: true, next: "/voter/home" };
}

export async function voterPortalLogout(): Promise<VoterActionResult> {
  await clearElectorSession();
  return { ok: true, next: "/voter" };
}

const IdentitySchema = z.object({
  studentId: z.string().trim().min(3),
  documentType: z.string().min(1),
  nationalId: z.string().trim().min(5),
});

export async function verifyStudentIdentity(input: {
  studentId: string;
  documentType: string;
  nationalId: string;
}): Promise<VoterActionResult> {
  const parsed = IdentitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter your student registration number and identity document number." };
  }
  const store = await readStore();
  if (!isDocumentTypeAllowed(parsed.data.documentType, store.identityDocumentPolicy)) {
    return {
      ok: false,
      error: store.identityDocumentPolicy.pendingPolicyNote,
      support: true,
    };
  }

  const student = store.studentElectors.find(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(parsed.data.studentId),
  );
  if (!student) {
    return {
      ok: false,
      error:
        "We could not find a student record for that registration number. We will not create a second student record. Use Help & Support so an authorized officer can check the institutional register.",
      support: true,
    };
  }

  const matches = nationalIdMatches({
    presented: parsed.data.nationalId,
    cipher: student.nationalIdCipher,
    studentId: student.studentId,
  });
  if (!matches) {
    return {
      ok: false,
      error:
        "The identity document number does not match the student record. Request an authorized correction. ORBIS will not silently create another student identity.",
      support: true,
    };
  }

  const existing = voterProfileFor(store, student.studentId);
  if (registrationBlocksDuplicate(existing)) {
    await openVoterSession(student);
    return {
      ok: false,
      error: `A voter registration already exists${existing?.registrationReference ? ` (${existing.registrationReference})` : ""}. Sign in to view your account instead of submitting again.`,
      next: "/voter/home",
    };
  }

  await writeStore((current) => {
    current.studentElectors = current.studentElectors.map((item) =>
      item.studentId === student.studentId
        ? {
            ...item,
            nationalIdCipher: encryptNationalId(normalizeNationalId(parsed.data.nationalId)),
            nationalIdLast4: last4(normalizeNationalId(parsed.data.nationalId)),
          }
        : item,
    );
    const profile = voterProfileFor(current, student.studentId) ?? emptyVoterDraft(student);
    profile.identityDocumentType = parsed.data.documentType;
    profile.identityDocumentLast4 = last4(normalizeNationalId(parsed.data.nationalId));
    profile.draftStep = Math.max(profile.draftStep, 2);
    profile.updatedAt = new Date().toISOString();
    upsertProfile(current, profile);
    if (!current.voterHistory.some((item) => item.studentId === student.studentId && item.kind === "REGISTRATION_STARTED")) {
      pushHistory(
        current,
        buildHistoryEvent({
          studentId: student.studentId,
          kind: "REGISTRATION_STARTED",
          title: "Registration started",
          detail: "Student identity was matched to the shared student record. Full name was retrieved from that record.",
        }),
      );
    }
    return current;
  });
  await openVoterSession(student);
  revalidateVoter();
  return { ok: true, next: "/voter/register" };
}

export async function requestIdentitySupport(input: {
  studentId: string;
  fullName: string;
  campusId: string;
  reason: string;
}): Promise<VoterActionResult> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Please explain what needs to be checked so an authorized officer can help." };
  }
  const store = await readStore();
  const campusId = input.campusId || store.campuses[0]?.id || "campus-ruaraka";
  const reference = `EXC-${Date.now().toString(36).toUpperCase()}`;
  await writeStore((current) => {
    current.voterExceptions = [
      {
        id: `exc-${crypto.randomUUID()}`,
        reference,
        studentId: null,
        fullName: input.fullName.trim() || "Not provided",
        registrationNumber: input.studentId.trim() || "Unknown",
        campusId,
        issue: "MISSING_FROM_REGISTER",
        reason: input.reason.trim(),
        verificationSource: "Student Voter Portal support request. Not a finance or ERP decision.",
        status: "PENDING",
        submittedByWorkId: input.studentId.trim() || "voter-portal",
        submittedByName: input.fullName.trim() || "Student (unmatched)",
        submittedAt: new Date().toISOString(),
        assignedReviewer: null,
        decisionNote: null,
        decidedBy: null,
        decidedAt: null,
        documents: [],
      },
      ...current.voterExceptions,
    ];
    return current;
  });
  revalidatePath("/commission/voters");
  return { ok: true, reference };
}

export async function requestPhoneOtp(input?: { phoneNumber?: string }): Promise<VoterActionResult> {
  const gate = await requireVoterStudent();
  if (!("studentId" in gate)) return gate;
  const phone = (input?.phoneNumber ?? gate.profile?.phoneNumber ?? studentPhone(gate.student)).replace(/\s+/g, "");
  if (!/^0[17]\d{8}$/.test(phone)) {
    return { ok: false, error: "Enter a Kenyan mobile number starting with 07 or 01, 10 digits in total." };
  }
  await writeStore((current) => {
    const profile = voterProfileFor(current, gate.studentId) ?? emptyVoterDraft(gate.student);
    profile.phoneNumber = phone;
    profile.updatedAt = new Date().toISOString();
    upsertProfile(current, profile);
    return current;
  });
  const demoOtp = await issueOtp(phoneOtpKey(gate.studentId));
  revalidateVoter();
  return {
    ok: true,
    demoOtp,
  };
}

export async function verifyVoterPhone(input: { code: string; phoneNumber?: string }): Promise<VoterActionResult> {
  const gate = await requireVoterStudent();
  if (!("studentId" in gate)) return gate;
  const key = phoneOtpKey(gate.studentId);
  const pending = await peekDemoOtp(key);
  if (!pending) {
    return { ok: false, error: "That code has expired or was not requested. Request a new code." };
  }
  const ok = await verifyOtp(key, input.code);
  if (!ok) {
    return { ok: false, error: "That code is not valid. Check the six digits and try again, or request another code." };
  }
  await writeStore((current) => {
    const profile = voterProfileFor(current, gate.studentId) ?? emptyVoterDraft(gate.student);
    profile.phoneNumber = input.phoneNumber?.replace(/\s+/g, "") || profile.phoneNumber;
    profile.phoneVerifiedAt = new Date().toISOString();
    profile.draftStep = Math.max(profile.draftStep, 3);
    profile.updatedAt = new Date().toISOString();
    upsertProfile(current, profile);
    pushHistory(
      current,
      buildHistoryEvent({
        studentId: gate.studentId,
        kind: "PHONE_VERIFIED",
        title: "Phone verified",
        detail: `Simulated OTP verified ${maskPhone(profile.phoneNumber)}. The one-time code is not stored as a reusable password.`,
      }),
    );
    return current;
  });
  revalidateVoter();
  return { ok: true };
}

export async function saveRegistrationDraft(input: { step: number }): Promise<VoterActionResult> {
  const gate = await requireVoterStudent();
  if (!("studentId" in gate)) return gate;
  await writeStore((current) => {
    const profile = voterProfileFor(current, gate.studentId) ?? emptyVoterDraft(gate.student);
    if (profile.registrationStatus !== "DRAFT") return current;
    profile.draftStep = Math.min(Math.max(input.step, 1), 5);
    profile.updatedAt = new Date().toISOString();
    upsertProfile(current, profile);
    notify(current, gate.studentId, "Your draft was saved", "You can continue voter registration later from this account.", "/voter/register");
    return current;
  });
  revalidateVoter();
  return { ok: true };
}

const CorrectionSchema = z.object({
  reason: z.string().trim().min(8),
  proposedCampusId: z.string().min(1),
  proposedSchoolId: z.string().min(1),
  proposedDepartmentId: z.string().optional(),
  proposedProgrammeId: z.string().optional(),
});

export async function requestAcademicCorrection(input: {
  reason: string;
  proposedCampusId: string;
  proposedSchoolId: string;
  proposedDepartmentId?: string;
  proposedProgrammeId?: string;
}): Promise<VoterActionResult> {
  const gate = await requireVoterStudent();
  if (!("studentId" in gate)) return gate;
  const parsed = CorrectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Explain the correction and choose campus then school from the approved lists." };

  const schools = schoolsForCampus(gate.store, parsed.data.proposedCampusId);
  if (!schools.some((item) => item.id === parsed.data.proposedSchoolId)) {
    return { ok: false, error: "Choose a school that belongs to the selected campus." };
  }
  const departments = departmentsForSchool(gate.store, parsed.data.proposedSchoolId);
  if (departments.length > 0) {
    if (!parsed.data.proposedDepartmentId || !departments.some((item) => item.id === parsed.data.proposedDepartmentId)) {
      return { ok: false, error: "Choose a department that belongs to that campus and school. A global department list is not shown." };
    }
  } else if (parsed.data.proposedDepartmentId) {
    return { ok: false, error: "No department mapping is configured for that school. The record will be referred for authorized review rather than guessed." };
  }
  const programmes = programmesForDepartment(
    gate.store,
    parsed.data.proposedSchoolId,
    parsed.data.proposedDepartmentId || null,
  );
  if (parsed.data.proposedProgrammeId && !programmes.some((item) => item.id === parsed.data.proposedProgrammeId)) {
    return { ok: false, error: "That programme is not in the approved mapping for the selected school and department." };
  }

  const profile = gate.profile ?? emptyVoterDraft(gate.student);
  await writeStore((current) => {
    current.academicCorrectionRequests = [
      {
        id: `acr-${crypto.randomUUID()}`,
        studentId: gate.studentId,
        voterProfileId: profile.id,
        reason: parsed.data.reason,
        proposedCampusId: parsed.data.proposedCampusId,
        proposedSchoolId: parsed.data.proposedSchoolId,
        proposedDepartmentId: parsed.data.proposedDepartmentId || null,
        proposedProgrammeId: parsed.data.proposedProgrammeId || null,
        status: "PENDING",
        submittedAt: new Date().toISOString(),
        decidedAt: null,
        decidedBy: null,
      },
      ...current.academicCorrectionRequests,
    ];
    current.voterExceptions = [
      {
        id: `exc-${crypto.randomUUID()}`,
        reference: `EXC-${Date.now().toString(36).toUpperCase()}`,
        studentId: gate.studentId,
        fullName: gate.student.fullName,
        registrationNumber: gate.student.studentId,
        campusId: gate.student.campusId,
        issue: "RECORD_MISMATCH",
        reason: parsed.data.reason,
        verificationSource: "Student requested an academic correction from the Voter Portal. Students cannot edit verified academic fields.",
        status: "PENDING",
        submittedByWorkId: gate.studentId,
        submittedByName: gate.student.fullName,
        submittedAt: new Date().toISOString(),
        assignedReviewer: null,
        decisionNote: null,
        decidedBy: null,
        decidedAt: null,
        documents: [],
      },
      ...current.voterExceptions,
    ];
    const nextProfile = voterProfileFor(current, gate.studentId) ?? profile;
    if (nextProfile.registrationStatus !== "DRAFT") {
      nextProfile.registrationStatus = "REQUIRES_CORRECTION";
    }
    nextProfile.updatedAt = new Date().toISOString();
    upsertProfile(current, nextProfile);
    pushHistory(
      current,
      buildHistoryEvent({
        studentId: gate.studentId,
        kind: "CORRECTION_REQUESTED",
        title: "Academic correction requested",
        detail: "The student asked authorized officers to review academic mapping. Verified fields were not changed by the student.",
      }),
    );
    notify(
      current,
      gate.studentId,
      "Correction request received",
      "Authorized officers will review your academic record. You cannot change those fields yourself.",
      "/voter/registration",
    );
    return current;
  });
  revalidateVoter();
  return { ok: true };
}

const AccessibilitySchema = z.object({
  categories: z.array(z.enum(["visual", "hearing", "mobility", "cognitive", "other"])),
  accommodations: z.array(z.string()),
  notes: z.string(),
  consentToShareOperationally: z.boolean(),
  withdraw: z.boolean().optional(),
});

export async function saveAccessibilityDeclaration(input: {
  categories: AccessibilityCategory[];
  accommodations: string[];
  notes: string;
  consentToShareOperationally: boolean;
  withdraw?: boolean;
}): Promise<VoterActionResult> {
  const gate = await requireVoterStudent();
  if (!("studentId" in gate)) return gate;
  const parsed = AccessibilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose the assistance that would help. Medical diagnoses are not required." };

  const declared = !parsed.data.withdraw && (parsed.data.categories.length > 0 || parsed.data.accommodations.length > 0 || parsed.data.notes.trim().length > 0);
  const accessibility: AccessibilityProfile = parsed.data.withdraw
    ? {
        declared: false,
        categories: [],
        accommodations: [],
        notes: "",
        updatedAt: new Date().toISOString(),
        consentToShareOperationally: false,
      }
    : {
        declared,
        categories: parsed.data.categories,
        accommodations: parsed.data.accommodations,
        notes: parsed.data.notes.trim(),
        updatedAt: new Date().toISOString(),
        consentToShareOperationally: declared ? parsed.data.consentToShareOperationally : false,
      };

  await writeStore((current) => {
    current.studentElectors = current.studentElectors.map((item) =>
      item.studentId === gate.studentId ? { ...item, accessibility, updatedAt: new Date().toISOString() } : item,
    );
    const profile = voterProfileFor(current, gate.studentId) ?? emptyVoterDraft(gate.student);
    profile.draftStep = Math.max(profile.draftStep, 5);
    profile.updatedAt = new Date().toISOString();
    upsertProfile(current, profile);
    pushHistory(
      current,
      buildHistoryEvent({
        studentId: gate.studentId,
        kind: parsed.data.withdraw ? "ACCESSIBILITY_WITHDRAWN" : "ACCESSIBILITY_UPDATED",
        title: parsed.data.withdraw ? "Accessibility preferences withdrawn" : "Accessibility preferences saved",
        detail: parsed.data.withdraw
          ? "The student withdrew optional accessibility preferences. This does not affect the right to request help on Election Day."
          : "Optional accessibility preferences were saved separately from any ballot. Registration approval is not affected.",
      }),
    );
    return current;
  });
  revalidateVoter();
  return { ok: true };
}

export async function submitVoterRegistration(): Promise<VoterActionResult> {
  const gate = await requireVoterStudent();
  if (!("studentId" in gate)) return gate;
  const profile = gate.profile ?? emptyVoterDraft(gate.student);
  if (registrationBlocksDuplicate(profile)) {
    return {
      ok: false,
      error: `You already have a voter registration${profile.registrationReference ? ` (${profile.registrationReference})` : ""}. Duplicate submissions are not accepted.`,
      next: "/voter/home",
    };
  }
  if (!profile.phoneVerifiedAt) {
    return { ok: false, error: "Verify your phone number before submitting." };
  }

  const unit = unitForStudent(gate.store, gate.student);
  const reference = newVoterReference();
  const now = new Date().toISOString();

  await writeStore((current) => {
    const next = voterProfileFor(current, gate.studentId) ?? profile;
    next.registrationReference = reference;
    next.registrationStatus = "PENDING_VERIFICATION";
    next.registrationDate = now;
    next.submittedAt = now;
    next.electoralUnitId = unit?.id ?? null;
    next.electoralUnitPending = !unit;
    next.draftStep = 5;
    next.updatedAt = now;
    upsertProfile(current, next);
    pushHistory(
      current,
      buildHistoryEvent({
        studentId: gate.studentId,
        kind: "REGISTRATION_SUBMITTED",
        title: "Registration submitted",
        detail: `Reference ${reference} was issued. Submission is not approval as an eligible elector.`,
      }),
    );
    pushHistory(
      current,
      buildHistoryEvent({
        studentId: gate.studentId,
        kind: "ACADEMIC_VERIFIED",
        title: "Academic information reviewed",
        detail: unit
          ? "Verified campus, school and electoral mapping were taken from the student record."
          : "Academic fields were shown from the student record. Electoral College mapping is pending authorized configuration.",
      }),
    );
    notify(
      current,
      gate.studentId,
      "Registration received",
      `Your reference is ${reference}. Verification is still required before you are an eligible elector.`,
      "/voter/registration",
    );
    return current;
  });
  await appendAudit({
    actorWorkId: gate.studentId,
    actorName: gate.student.fullName,
    action: "submit_voter_registration",
    detail: `${gate.student.fullName} submitted voter registration ${reference}. Eligibility was not auto-approved.`,
    highRisk: false,
    entity: "voter_profile",
    entityId: profile.id,
  });
  revalidateVoter();
  return { ok: true, reference, next: "/voter/registration?ack=1" };
}

export async function markVoterNotificationsRead(): Promise<VoterActionResult> {
  const gate = await requireVoterStudent();
  if (!("studentId" in gate)) return gate;
  await writeStore((current) => {
    current.voterNotifications = current.voterNotifications.map((item) =>
      item.studentId === gate.studentId ? { ...item, read: true } : item,
    );
    return current;
  });
  revalidateVoter();
  return { ok: true };
}
