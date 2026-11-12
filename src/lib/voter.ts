import { academicSnapshot, courseLabelForStudent } from "@/lib/academic";
import { mockPhone, maskNationalId } from "@/lib/identity";
import { unitForStudent, unitLabel } from "@/lib/electoral";
import { election1, election2 } from "@/lib/elections";
import type {
  AppStore,
  ElectionStage,
  StudentElector,
  VoterHistoryEvent,
  VoterHistoryKind,
  VoterProfile,
  VoterRegistrationStatus,
  Election2VoterStatus,
} from "@/lib/types";

export const VOTER_NAV = [
  { href: "/voter/home", label: "Dashboard", icon: "▣", description: "Your registration at a glance" },
  { href: "/voter/registration", label: "My Voter Registration", icon: "🗳", description: "Status and reference" },
  { href: "/voter/eligibility", label: "Election Eligibility", icon: "✔", description: "Election 1 and Election 2" },
  { href: "/voter/accessibility", label: "Accessibility & Assistance", icon: "♿", description: "Optional voting support" },
  { href: "/voter/history", label: "My History", icon: "🕘", description: "Account and eligibility events" },
  { href: "/voter/help", label: "Help & Support", icon: "?", description: "How this portal works" },
  { href: "/voter/profile", label: "My Profile", icon: "👤", description: "Your student and voter record" },
] as const;

export const REGISTRATION_STEPS = [
  { id: 1, key: "identity", title: "Student Identity" },
  { id: 2, key: "phone", title: "Phone Verification" },
  { id: 3, key: "academic", title: "Academic Information" },
  { id: 4, key: "accessibility", title: "Accessibility & Assistance" },
  { id: 5, key: "review", title: "Review and Submit" },
] as const;

export const ACCESSIBILITY_COPY =
  "You may tell us about any assistance or accessibility arrangements you would like during voting. This information is voluntary and confidential. You can also request assistance on Election Day even if you do not complete this section now.";

export const ACCESSIBILITY_CATEGORIES = [
  { id: "visual", label: "Blindness or low vision" },
  { id: "hearing", label: "Deafness or hard of hearing" },
  { id: "mobility", label: "Physical or mobility assistance" },
  { id: "cognitive", label: "Cognitive or learning-related assistance" },
  { id: "other", label: "Other assistance" },
] as const;

export const ACCESSIBILITY_ACCOMMODATIONS: Record<string, { id: string; label: string }[]> = {
  visual: [
    { id: "screen-reader", label: "Screen-reader support" },
    { id: "audio-guidance", label: "Audio guidance" },
    { id: "larger-text", label: "Larger text" },
    { id: "high-contrast", label: "High-contrast display" },
  ],
  hearing: [
    { id: "captions", label: "Captions" },
    { id: "written-instructions", label: "Written instructions" },
    { id: "sign-language", label: "Sign-language instructional content" },
  ],
  mobility: [
    { id: "large-controls", label: "Large controls" },
    { id: "keyboard-navigation", label: "Keyboard navigation" },
    { id: "alternative-input", label: "Alternative input devices" },
    { id: "accessible-workstation", label: "Accessible workstation" },
  ],
  cognitive: [
    { id: "simplified-instructions", label: "Simplified instructions" },
    { id: "one-step", label: "One-step-at-a-time guidance" },
    { id: "additional-time", label: "Additional time" },
    { id: "guided-voting", label: "Guided voting instructions" },
  ],
};

export const REGISTRATION_STATUS_COPY: Record<
  VoterRegistrationStatus,
  { label: string; meaning: string; tone: "navy" | "gold" | "warn" | "ok" | "danger" }
> = {
  DRAFT: {
    label: "Draft — not submitted",
    meaning: "You started registration and can continue later. This is not yet a submitted application.",
    tone: "navy",
  },
  SUBMITTED: {
    label: "Submitted",
    meaning: "Your form has been received. Submission is not the same as being approved to vote.",
    tone: "gold",
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    meaning: "The Commission is checking your details against the student record. You cannot approve yourself.",
    tone: "gold",
  },
  VERIFIED: {
    label: "Verified",
    meaning: "Your identity and academic record have been verified. Eligibility is a separate decision.",
    tone: "ok",
  },
  REQUIRES_CORRECTION: {
    label: "Requires Correction",
    meaning: "Something on the record needs an authorized update. You cannot change verified academic information yourself.",
    tone: "warn",
  },
  APPROVED_ELIGIBLE: {
    label: "Approved as Eligible Elector",
    meaning: "You are an approved eligible elector for the election this status applies to. This does not allow voting from home.",
    tone: "ok",
  },
  REJECTED: {
    label: "Rejected",
    meaning: "An authorized decision has been recorded. Use Help & Support if you need the decision explained.",
    tone: "danger",
  },
};

export const ELECTION2_STATUS_COPY: Record<
  Election2VoterStatus,
  { label: string; meaning: string }
> = {
  AWAITING_DELEGATE_OUTCOME: {
    label: "Awaiting Delegate Election Outcome",
    meaning: "Election 1 has not concluded. Election 2 is only for authorized delegates on the Electoral College Register.",
  },
  NOT_ELECTED: {
    label: "Not Elected — Not Eligible",
    meaning: "You contested Election 1 and were not elected. That does not make you an Election 2 elector.",
  },
  PENDING_CONFIRMATION: {
    label: "Pending Confirmation",
    meaning: "You were elected in Election 1, but results are not yet finalized on the Electoral College Register.",
  },
  ELIGIBLE_DELEGATE: {
    label: "Eligible Delegate Elector",
    meaning: "You are included in the approved Electoral College Register for Election 2.",
  },
  UNDER_REVIEW: {
    label: "Under Review / Suspended",
    meaning: "Your delegate standing is under review. Election 2 access is not available while this status remains.",
  },
};

const BALLOT_SECRET_PATTERN =
  /\b(voted for|selected candidate|ballot choice|candidate selection|chose candidate)\b/i;

export function phoneOtpKey(studentId: string) {
  return `voter-phone:${studentId.trim().toUpperCase()}`;
}

export function newVoterReference() {
  return `VR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function voterProfileFor(store: AppStore, studentId: string) {
  return store.voterProfiles.find((item) => item.studentId === studentId) ?? null;
}

export function studentPhone(student: StudentElector) {
  return student.phoneNumber || mockPhone(student.studentId);
}

export function registrationBlocksDuplicate(profile: VoterProfile | null) {
  if (!profile) return false;
  return profile.registrationStatus !== "DRAFT";
}

export function canContinueDraft(profile: VoterProfile | null) {
  return profile?.registrationStatus === "DRAFT";
}

export function historyIsSafe(detail: string) {
  return !BALLOT_SECRET_PATTERN.test(detail);
}

export function sanitizeHistoryDetail(detail: string) {
  if (!historyIsSafe(detail)) {
    return "A participation status change was recorded. Ballot choices are not stored in this history.";
  }
  return detail;
}

export function election1Concluded(stage: ElectionStage) {
  return stage === "CLOSED" || stage === "CERTIFIED";
}

export function deriveElection2Status(store: AppStore, student: StudentElector, profile: VoterProfile | null): Election2VoterStatus {
  const college = store.electoralCollege;
  const inRegister = college.entries.find((entry) => entry.studentId === student.studentId);
  if (college.status === "verified" || college.status === "active") {
    if (inRegister?.electorStatus === "ineligible") return "UNDER_REVIEW";
    if (inRegister) return "ELIGIBLE_DELEGATE";
  }

  const elected = store.electedDelegates.find((item) => item.studentId === student.studentId);
  if (elected) {
    return elected.confirmed ? "ELIGIBLE_DELEGATE" : "PENDING_CONFIRMATION";
  }

  if (election1Concluded(election1(store).stage)) {
    const contested = store.delegateCandidates.some((item) => item.studentId === student.studentId);
    if (contested) return "NOT_ELECTED";
    return "AWAITING_DELEGATE_OUTCOME";
  }

  if (profile?.simulatedElection2Status) return profile.simulatedElection2Status;
  return "AWAITING_DELEGATE_OUTCOME";
}

export function election1Participation(student: StudentElector) {
  return student.election1VotingStatus === "voted" || student.voterStatus === "voted"
    ? "Vote Cast"
    : "Not Yet Voted";
}

export function assignedStation(store: AppStore, student: StudentElector) {
  return store.pollingStations.find((station) => station.campusId === student.campusId) ?? null;
}

export function outstandingActions(input: {
  profile: VoterProfile;
  student: StudentElector;
  unitPending: boolean;
  correctionPending: boolean;
}) {
  const actions: string[] = [];
  if (input.profile.registrationStatus === "DRAFT") {
    actions.push("Continue and submit your voter registration.");
  }
  if (input.profile.registrationStatus === "REQUIRES_CORRECTION" || input.correctionPending) {
    actions.push("An academic correction is waiting for authorized review.");
  }
  if (!input.profile.phoneVerifiedAt && input.profile.registrationStatus === "DRAFT") {
    actions.push("Verify your mobile phone number.");
  }
  if (input.unitPending) {
    actions.push("Your Electoral College mapping is pending authorized configuration. You cannot choose a college yourself.");
  }
  if (input.profile.registrationStatus === "PENDING_VERIFICATION") {
    actions.push("Wait for Commission verification. You cannot approve your own eligibility.");
  }
  return actions;
}

export function voterDashboardModel(store: AppStore, student: StudentElector, profile: VoterProfile) {
  const academic = academicSnapshot(store, student);
  const unit = unitForStudent(store, student);
  const unitPending = !unit || profile.electoralUnitPending;
  const correctionPending = store.academicCorrectionRequests.some(
    (item) => item.studentId === student.studentId && item.status === "PENDING",
  );
  const station = assignedStation(store, student);
  const electionOne = election1(store);
  const electionTwo = election2(store);
  const election2Status = deriveElection2Status(store, student, profile);

  const { nationalIdCipher, ...publicStudent } = student;
  void nationalIdCipher;
  return {
    student: publicStudent,
    profile,
    academic,
    courseLabel: courseLabelForStudent(store, student),
    unit,
    unitLabel: unit ? unitLabel(unit) : null,
    unitPending,
    station,
    electionOne,
    electionTwo,
    election1Eligible: profile.registrationStatus === "APPROVED_ELIGIBLE" && student.election1Eligibility === "eligible",
    election1Participation: election1Participation(student),
    election2Status,
    election2Copy: ELECTION2_STATUS_COPY[election2Status],
    statusCopy: REGISTRATION_STATUS_COPY[profile.registrationStatus],
    nationalIdMasked: maskNationalId(student.nationalIdLast4),
    phone: studentPhone(student),
    actions: outstandingActions({ profile, student, unitPending, correctionPending }),
    correctionPending,
  };
}

export function buildHistoryEvent(input: {
  studentId: string;
  kind: VoterHistoryKind;
  title: string;
  detail: string;
  at?: string;
}): VoterHistoryEvent {
  return {
    id: `vh-${crypto.randomUUID()}`,
    studentId: input.studentId,
    kind: input.kind,
    title: input.title,
    detail: sanitizeHistoryDetail(input.detail),
    at: input.at ?? new Date().toISOString(),
  };
}

export function emptyVoterDraft(student: StudentElector): VoterProfile {
  const now = new Date().toISOString();
  return {
    id: `vp-${student.studentId.replace("/", "-")}`,
    studentId: student.studentId,
    registrationReference: null,
    registrationStatus: "DRAFT",
    registrationDate: null,
    submittedAt: null,
    phoneNumber: studentPhone(student),
    phoneVerifiedAt: null,
    identityDocumentType: "NATIONAL_ID",
    identityDocumentLast4: student.nationalIdLast4 ?? "",
    electoralUnitId: null,
    electoralUnitPending: false,
    simulatedElection2Status: null,
    draftStep: 1,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function pollingInstructions(store: AppStore, student: StudentElector) {
  const station = assignedStation(store, student);
  const electionOne = election1(store);
  const lines = [
    "This portal is for voter registration and your account. It is not a remote voting website.",
    "The agreed prototype uses designated campus polling stations and authorized computers.",
    "Registration does not authorize voting from home.",
  ];
  if (station) {
    lines.push(`Your assigned campus polling station is ${station.name}.`);
  }
  if (electionOne.electionDate) {
    lines.push(
      `Election 1 is configured for ${electionOne.electionDate} (${electionOne.startTime}–${electionOne.endTime}) at the campus station. These times come from Commission configuration.`,
    );
  }
  return lines;
}
