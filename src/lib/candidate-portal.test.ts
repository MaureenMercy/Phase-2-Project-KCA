import { describe, expect, it } from "vitest";
import {
  agentCapacity,
  applicationWindowState,
  canNominateAgents,
  deriveElectoralCollege,
  duplicateSubmissionError,
  emptyApplication,
  jointTicketBlocked,
  openCouncilPositions,
  requiredDocumentsFor,
  validateSubmission,
} from "@/lib/candidate-portal";
import { mockStudentNationalId } from "@/lib/identity";
import { createInitialStore } from "@/lib/seed";
import type { CandidatePortalApplication, StudentIdentity } from "@/lib/types";

const TINY_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function identityById(studentId: string) {
  const store = createInitialStore();
  const identity = store.studentIdentities.find((item) => item.studentId === studentId);
  if (!identity) throw new Error(`missing ${studentId}`);
  return { store, identity };
}

function draftFrom(identity: StudentIdentity, store = createInitialStore()): CandidatePortalApplication {
  const application = emptyApplication({
    id: "capp-test",
    studentId: identity.studentId,
    candidateProfileId: "cprof-test",
    electionId: store.election.id,
    identity,
    now: "2026-11-12T08:00:00.000Z",
  });
  application.photograph = {
    id: "photo-1",
    kind: "photograph",
    filename: "portrait.png",
    mimeType: "image/png",
    size: 32,
    dataUrl: TINY_PHOTO,
    uploadedAt: application.createdAt,
  };
  application.declarations = {
    informationAccurate: true,
    understandNotApproval: true,
    consentToProcessIdentity: true,
    acceptCandidateDeclaration: true,
  };
  return application;
}

describe("candidate electoral college mapping", () => {
  it("uses Ruaraka department colleges and does not let a student pick another unit", () => {
    const { store, identity } = identityById("24/01212");
    const college = deriveElectoralCollege(store, identity);
    expect(college.mappingStatus).toBe("resolved");
    expect(college.kind).toBe("DEPARTMENT");
    expect(college.label).toMatch(/Accounting and Finance/);
    expect(college.departmentId).toBe("dept-ru-bus-af");
  });

  it("uses Western / Kisumu school groupings without inventing departments", () => {
    const { store, identity } = identityById("24/02102");
    const college = deriveElectoralCollege(store, identity);
    expect(college.mappingStatus).toBe("resolved");
    expect(college.kind).toBe("SCHOOL");
    expect(college.label).toMatch(/Western \/ Kisumu/);
    expect(college.departmentId).toBeNull();
  });

  it("treats Town and Kitengela as campus-wide Electoral Colleges", () => {
    const town = identityById("24/03201");
    const townCollege = deriveElectoralCollege(town.store, town.identity);
    expect(townCollege.kind).toBe("CAMPUS");
    expect(townCollege.label).toBe("Town Campus Electoral College");

    const kitengela = identityById("24/04301");
    const kitCollege = deriveElectoralCollege(kitengela.store, kitengela.identity);
    expect(kitCollege.kind).toBe("CAMPUS");
    expect(kitCollege.label).toBe("Kitengela Campus Electoral College");
  });

  it("shows pending configuration when a Ruaraka record has no department mapping", () => {
    const { store, identity } = identityById("24/01212");
    const college = deriveElectoralCollege(store, { ...identity, departmentId: null });
    expect(college.mappingStatus).toBe("pending_configuration");
  });
});

describe("candidate application validation", () => {
  it("accepts a complete Delegates Election application", () => {
    const { store, identity } = identityById("24/01212");
    const application = draftFrom(identity, store);
    application.applicationType = "DELEGATE";
    application.electoralCollege = deriveElectoralCollege(store, identity);
    application.documents = [
      {
        id: "doc-1",
        kind: "candidate-statement",
        filename: "statement.pdf",
        mimeType: "application/pdf",
        size: 12,
        dataUrl: "data:application/pdf;base64,JVBERi0xLjAK",
        uploadedAt: application.createdAt,
      },
    ];
    expect(validateSubmission(store, application)).toEqual([]);
  });

  it("accepts a complete SAKU Council application for an open position", () => {
    const { store, identity } = identityById("24/01212");
    const application = draftFrom(identity, store);
    application.applicationType = "SAKU_COUNCIL";
    application.councilPositionId = "pos-academic";
    application.documents = [
      {
        id: "doc-1",
        kind: "campaign-statement",
        filename: "statement.pdf",
        mimeType: "application/pdf",
        size: 12,
        dataUrl: "data:application/pdf;base64,JVBERi0xLjAK",
        uploadedAt: application.createdAt,
      },
    ];
    expect(validateSubmission(store, application)).toEqual([]);
  });

  it("does not show closed Council positions as available", () => {
    const store = createInitialStore();
    const open = openCouncilPositions(store.portalConfig);
    expect(open.some((item) => item.id === "pos-sports")).toBe(false);
    expect(open.some((item) => item.id === "pos-academic")).toBe(true);
  });

  it("blocks President / Vice President until the joint-ticket workflow is configured", () => {
    const { store, identity } = identityById("24/01212");
    const application = draftFrom(identity, store);
    application.applicationType = "SAKU_COUNCIL";
    application.councilPositionId = "pos-president";
    const position = store.portalConfig.councilPositions.find((item) => item.id === "pos-president")!;
    expect(jointTicketBlocked(store.portalConfig, position)).toBe(true);
    expect(validateSubmission(store, application).some((item) => item.field === "councilPositionId")).toBe(
      true,
    );
  });

  it("rejects an incomplete form that is missing the photograph and declarations", () => {
    const { store, identity } = identityById("24/01212");
    const application = emptyApplication({
      id: "capp-incomplete",
      studentId: identity.studentId,
      candidateProfileId: "cprof-test",
      electionId: store.election.id,
      identity,
      now: "2026-11-12T08:00:00.000Z",
    });
    application.applicationType = "DELEGATE";
    application.electoralCollege = deriveElectoralCollege(store, identity);
    const errors = validateSubmission(store, application);
    expect(errors.some((item) => item.field === "photograph")).toBe(true);
    expect(errors.some((item) => item.field === "informationAccurate")).toBe(true);
  });

  it("requires the configured supporting document", () => {
    const { store, identity } = identityById("24/01212");
    const application = draftFrom(identity, store);
    application.applicationType = "DELEGATE";
    application.electoralCollege = deriveElectoralCollege(store, identity);
    const required = requiredDocumentsFor(store.portalConfig, application);
    expect(required.map((item) => item.id)).toContain("candidate-statement");
    expect(validateSubmission(store, application).some((item) => item.field === "document:candidate-statement")).toBe(
      true,
    );
  });

  it("prevents a second send of an already submitted application", () => {
    const { identity } = identityById("24/01212");
    const application = draftFrom(identity);
    application.status = "Submitted";
    application.reference = "CAN-2026-5555";
    expect(duplicateSubmissionError(application)).toMatch(/already been submitted/);
    expect(duplicateSubmissionError(application)).toMatch(/CAN-2026-5555/);
  });

  it("enforces a closed application window", () => {
    const store = createInitialStore();
    store.portalConfig.applicationWindows.DELEGATE = {
      status: "configured",
      opensAt: "2026-01-01T00:00:00.000Z",
      closesAt: "2026-01-31T00:00:00.000Z",
    };
    const closed = applicationWindowState(store.portalConfig.applicationWindows.DELEGATE, new Date("2026-11-12"));
    expect(closed.open).toBe(false);
    expect(closed.reason).toMatch(/closed/);
  });

  it("does not invent application dates when the Commission has not configured them", () => {
    const pending = applicationWindowState({
      status: "awaiting_commission",
      opensAt: null,
      closesAt: null,
    });
    expect(pending.open).toBe(false);
    expect(pending.reason).toMatch(/have not been set/);
  });

  it("blocks a Delegates application when electoral mapping is missing", () => {
    const { store, identity } = identityById("24/01212");
    const application = draftFrom(identity, store);
    application.applicationType = "DELEGATE";
    application.electoralCollege = deriveElectoralCollege(store, { ...identity, departmentId: null });
    expect(validateSubmission(store, application).some((item) => item.field === "electoralCollege")).toBe(
      true,
    );
  });
});

describe("agent nomination rules", () => {
  it("allows invitations only after a SAKU Council application is approved", () => {
    const application = {
      status: "Submitted",
      applicationType: "SAKU_COUNCIL",
    } as CandidatePortalApplication;
    expect(canNominateAgents(application)).toBe(false);
    expect(canNominateAgents({ ...application, status: "Approved" })).toBe(true);
    expect(
      canNominateAgents({ status: "Approved", applicationType: "DELEGATE" } as CandidatePortalApplication),
    ).toBe(false);
  });

  it("uses the Commission-configured agent limit rather than a hard-coded number", () => {
    const store = createInitialStore();
    store.portalConfig.maxAgentsPerCandidate = 1;
    const capacity = agentCapacity(store.portalConfig, [
      {
        id: "a1",
        invitationReference: "AGN-1",
        candidateApplicationId: "capp-collins-1",
        nominatingStudentId: "24/01511",
        proposedStudentId: "24/01212",
        proposedFullName: "Ian",
        proposedPhoneMasked: "0702••••12",
        agentRegistrationComplete: false,
        accreditationStatus: "not_accredited",
        status: "invited",
        createdAt: "2026-11-12T08:00:00.000Z",
      },
    ]);
    expect(capacity.max).toBe(1);
    expect(capacity.remaining).toBe(0);
  });
});

describe("shared identity", () => {
  it("keeps one student identity record for seeded students including National ID references", () => {
    const store = createInitialStore();
    expect(store.studentIdentities).toHaveLength(store.studentElectors.length);
    const ian = store.studentIdentities.find((item) => item.studentId === "24/01212");
    expect(ian?.nationalIdHash).toBeTruthy();
    expect(ian?.nationalIdEncrypted).not.toContain(mockStudentNationalId("24/01212"));
    expect(store.candidatePortalApplications[0]?.ballotParticipationStatus).toBe("not_configured");
  });
});
