import { describe, expect, it } from "vitest";
import { departmentsForSchool, schoolsForCampus, academicSnapshot } from "@/lib/academic";
import { decryptNationalId, encryptNationalId } from "@/lib/identity-crypto";
import {
  isDocumentTypeAllowed,
  last4,
  maskNationalId,
  mockNationalId,
  mockPhone,
  nationalIdMatches,
  DEFAULT_IDENTITY_DOCUMENT_POLICY,
} from "@/lib/identity";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { createInitialStore } from "@/lib/seed";
import { unitForStudent } from "@/lib/electoral";
import {
  buildHistoryEvent,
  deriveElection2Status,
  emptyVoterDraft,
  historyIsSafe,
  registrationBlocksDuplicate,
  sanitizeHistoryDetail,
  studentPhone,
  voterDashboardModel,
  voterProfileFor,
} from "@/lib/voter";

describe("shared student identity", () => {
  it("encrypts National ID and masks it in ordinary views", () => {
    const cipher = encryptNationalId("32401204");
    expect(cipher).not.toContain("32401204");
    expect(decryptNationalId(cipher)).toBe("32401204");
    expect(maskNationalId("1204")).toBe("••••1204");
  });

  it("matches a seeded student without creating another record", () => {
    const store = createInitialStore();
    const student = store.studentElectors.find((item) => item.studentId === "24/01204")!;
    expect(nationalIdMatches({ presented: mockNationalId("24/01204"), studentId: student.studentId })).toBe(true);
    expect(nationalIdMatches({ presented: "00000000", studentId: student.studentId })).toBe(false);
    expect(store.studentElectors.filter((item) => item.studentId === "24/01204")).toHaveLength(1);
    expect(student.nationalIdLast4).toBe(last4(mockNationalId("24/01204")));
  });

  it("does not invent an alternative-document policy", () => {
    expect(isDocumentTypeAllowed("NATIONAL_ID")).toBe(true);
    expect(isDocumentTypeAllowed("PASSPORT")).toBe(false);
    expect(DEFAULT_IDENTITY_DOCUMENT_POLICY.pendingPolicyNote).toMatch(/not yet been finalized/i);
  });
});

describe("phone OTP simulation", () => {
  it("rejects an invalid code and an expired code without storing reusable plaintext", async () => {
    const key = "voter-phone:24/01204";
    const code = await issueOtp(key);
    expect(code).toHaveLength(6);
    await expect(verifyOtp(key, "000000")).resolves.toBe(false);
    const fresh = await issueOtp(key);
    await expect(verifyOtp(key, fresh)).resolves.toBe(true);
    await expect(verifyOtp(key, fresh)).resolves.toBe(false);

    const expiredCode = await issueOtp(key, { ttlMs: -1 });
    await expect(verifyOtp(key, expiredCode)).resolves.toBe(false);
  });
});

describe("voter registration vs eligibility", () => {
  it("keeps an unregistered student off the voter profile table", () => {
    const store = createInitialStore();
    expect(voterProfileFor(store, "24/01204")).toBeNull();
    expect(store.studentElectors.some((item) => item.studentId === "24/01204")).toBe(true);
  });

  it("blocks a second registration once a form is no longer a draft", () => {
    const store = createInitialStore();
    const approved = voterProfileFor(store, "24/01211")!;
    expect(registrationBlocksDuplicate(approved)).toBe(true);
    const draft = voterProfileFor(store, "24/01313")!;
    expect(registrationBlocksDuplicate(draft)).toBe(false);
    expect(registrationBlocksDuplicate(null)).toBe(false);
  });

  it("does not treat submission as automatic eligibility", () => {
    const store = createInitialStore();
    const student = store.studentElectors.find((item) => item.studentId === "24/01204")!;
    const draft = emptyVoterDraft(student);
    draft.registrationStatus = "PENDING_VERIFICATION";
    draft.registrationReference = "VR-2026-TEST";
    expect(draft.registrationStatus).not.toBe("APPROVED_ELIGIBLE");
    const model = voterDashboardModel(store, student, draft);
    expect(model.election1Eligible).toBe(false);
    expect(model.statusCopy.label).toMatch(/Pending Verification/i);
  });

  it("surfaces seeded pending, approved and rejected outcomes", () => {
    const store = createInitialStore();
    expect(voterProfileFor(store, "24/01301")?.registrationStatus).toBe("PENDING_VERIFICATION");
    expect(voterProfileFor(store, "24/01211")?.registrationStatus).toBe("APPROVED_ELIGIBLE");
    expect(voterProfileFor(store, "24/03401")?.registrationStatus).toBe("REJECTED");
    expect(voterProfileFor(store, "24/01401")?.registrationStatus).toBe("REQUIRES_CORRECTION");
  });
});

describe("academic mapping", () => {
  it("cascades campus to school to department and never lists unrelated departments", () => {
    const store = createInitialStore();
    const ruSchools = schoolsForCampus(store, "campus-ruaraka");
    expect(ruSchools.every((item) => item.campusId === "campus-ruaraka")).toBe(true);
    const sobDepts = departmentsForSchool(store, "school-ru-bus");
    expect(sobDepts.map((item) => item.name).join(" ")).toMatch(/Business Administration and Management/);
    expect(sobDepts.map((item) => item.name).join(" ")).toMatch(/Accounting and Finance/);
    expect(sobDepts.map((item) => item.name).join(" ")).toMatch(/Economics and Statistics/);
    expect(sobDepts.some((item) => item.schoolId !== "school-ru-bus")).toBe(false);
    expect(sobDepts.some((item) => item.name.includes("Software"))).toBe(false);

    const westernTech = departmentsForSchool(store, "school-we-tech");
    expect(westernTech).toHaveLength(0);
  });

  it("flags a missing electoral-unit mapping instead of guessing", () => {
    const store = createInitialStore();
    const student = store.studentElectors.find((item) => item.studentId === "24/01901")!;
    expect(unitForStudent(store, student)).toBeNull();
    const profile = voterProfileFor(store, "24/01901")!;
    const model = voterDashboardModel(store, student, profile);
    expect(model.unitPending).toBe(true);
    expect(model.actions.some((item) => item.toLowerCase().includes("pending"))).toBe(true);
  });

  it("uses campus-wide colleges for Town and Kitengela", () => {
    const store = createInitialStore();
    const town = store.studentElectors.find((item) => item.studentId === "24/03101")!;
    const kitengela = store.studentElectors.find((item) => item.studentId === "24/04101")!;
    expect(unitForStudent(store, town)?.unitKind).toBe("CAMPUS_WIDE");
    expect(unitForStudent(store, kitengela)?.unitKind).toBe("CAMPUS_WIDE");
    const snapshot = academicSnapshot(store, town);
    expect(snapshot.campusName).toBe("Town");
  });
});

describe("election-specific eligibility", () => {
  it("keeps Election 2 off voter registration alone", () => {
    const store = createInitialStore();
    const voterOnly = store.studentElectors.find((item) => item.studentId === "24/01211")!;
    const profile = voterProfileFor(store, "24/01211")!;
    expect(deriveElection2Status(store, voterOnly, profile)).toBe("AWAITING_DELEGATE_OUTCOME");
  });

  it("uses simulated Election 1 outcomes without exposing ballot choices", () => {
    const store = createInitialStore();
    expect(deriveElection2Status(store, store.studentElectors.find((item) => item.studentId === "24/01201")!, voterProfileFor(store, "24/01201"))).toBe("NOT_ELECTED");
    expect(deriveElection2Status(store, store.studentElectors.find((item) => item.studentId === "24/01202")!, voterProfileFor(store, "24/01202"))).toBe("PENDING_CONFIRMATION");
    expect(deriveElection2Status(store, store.studentElectors.find((item) => item.studentId === "24/03101")!, voterProfileFor(store, "24/03101"))).toBe("ELIGIBLE_DELEGATE");
    expect(deriveElection2Status(store, store.studentElectors.find((item) => item.studentId === "24/04101")!, voterProfileFor(store, "24/04101"))).toBe("UNDER_REVIEW");
  });

  it("shows Election 1 participation without candidate selection", () => {
    const store = createInitialStore();
    const voted = store.studentElectors.find((item) => item.studentId === "24/02101")!;
    const model = voterDashboardModel(store, voted, voterProfileFor(store, "24/02101")!);
    expect(model.election1Participation).toBe("Vote Cast");
    expect(JSON.stringify(model)).not.toMatch(/voted for/i);
  });
});

describe("accessibility and ballot secrecy", () => {
  it("allows combined accessibility preferences without changing eligibility", () => {
    const store = createInitialStore();
    const student = store.studentElectors.find((item) => item.studentId === "24/04302")!;
    expect(student.accessibility.categories.sort()).toEqual(["mobility", "visual"]);
    const model = voterDashboardModel(store, student, voterProfileFor(store, "24/04302")!);
    expect(model.profile.registrationStatus).toBe("APPROVED_ELIGIBLE");
    const none = { ...student, accessibility: { ...student.accessibility, declared: false, categories: [] } };
    expect(voterDashboardModel(store, none, voterProfileFor(store, "24/04302")!).profile.registrationStatus).toBe("APPROVED_ELIGIBLE");
  });

  it("strips ballot-secret language from history details", () => {
    expect(historyIsSafe("Registration submitted. Reference VR-2026-A12F11.")).toBe(true);
    expect(historyIsSafe("Student voted for Jane Auma Otieno")).toBe(false);
    expect(sanitizeHistoryDetail("Student selected candidate 24/01203")).toMatch(/not stored/i);
    const event = buildHistoryEvent({
      studentId: "24/01204",
      kind: "ELECTION1_PARTICIPATION",
      title: "Participation updated",
      detail: "Student voted for the Unity Ticket",
    });
    expect(event.detail).not.toMatch(/unity ticket/i);
  });

  it("does not attach National ID ciphertext to ordinary dashboard views", () => {
    const store = createInitialStore();
    const student = store.studentElectors.find((item) => item.studentId === "24/01211")!;
    const model = voterDashboardModel(store, student, voterProfileFor(store, "24/01211")!);
    expect(model.nationalIdMasked).toBe(maskNationalId(last4(mockNationalId("24/01211"))));
    expect(JSON.stringify(model)).not.toContain("nationalIdCipher");
    expect(JSON.stringify(model)).not.toContain(student.nationalIdCipher);
    expect(studentPhone(student)).toBe(mockPhone("24/01211"));
  });
});
