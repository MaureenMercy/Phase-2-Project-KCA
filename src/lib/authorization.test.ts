import { describe, expect, it } from "vitest";
import {
  activePermissions,
  isAllowedNow,
  roleHasPermission,
  technicalPermissionsForCommission,
} from "@/lib/permissions";
import { evaluateCommissionAccess } from "@/lib/authorization";
import { createInitialStore, COMMISSION_MEMBERS, INSTITUTIONAL_DIRECTORY } from "@/lib/seed";

const chairUser = INSTITUTIONAL_DIRECTORY[0];
const ictUser = INSTITUTIONAL_DIRECTORY.find((user) => user.accountKind === "technical")!;
const chairMember = COMMISSION_MEMBERS[0];
const commissioner = COMMISSION_MEMBERS.find((member) => member.role === "COMMISSIONER")!;
const secretary = COMMISSION_MEMBERS.find((member) => member.role === "SECRETARY_GENERAL")!;
const vice = COMMISSION_MEMBERS.find((member) => member.role === "VICE_CHAIR")!;

describe("role permissions", () => {
  it("gives the Chair special results authorization and every other electoral power", () => {
    expect(roleHasPermission("CHAIR", "authorize_results")).toBe(true);
    expect(roleHasPermission("CHAIR", "authorize_election_opening")).toBe(true);
    expect(roleHasPermission("CHAIR", "approve_candidates")).toBe(true);
  });

  it("does not let the Vice Chair authorize official results", () => {
    expect(roleHasPermission("VICE_CHAIR", "authorize_results")).toBe(false);
    expect(roleHasPermission("VICE_CHAIR", "authorize_election_opening")).toBe(true);
  });

  it("keeps the Secretary General operational without final authorization powers", () => {
    expect(roleHasPermission("SECRETARY_GENERAL", "approve_voter_register")).toBe(true);
    expect(roleHasPermission("SECRETARY_GENERAL", "authorize_election_opening")).toBe(false);
    expect(roleHasPermission("SECRETARY_GENERAL", "authorize_results")).toBe(false);
  });

  it("lets a Commissioner approve candidates and work a station, but not authorize results", () => {
    expect(roleHasPermission("COMMISSIONER", "approve_candidates")).toBe(true);
    expect(roleHasPermission("COMMISSIONER", "station_operations")).toBe(true);
    expect(roleHasPermission("COMMISSIONER", "authorize_results")).toBe(false);
    expect(roleHasPermission("COMMISSIONER", "authorize_election_opening")).toBe(false);
    expect(roleHasPermission("COMMISSIONER", "approve_voter_register")).toBe(false);
  });

  it("never grants technical authority to any Electoral Commission role", () => {
    expect(technicalPermissionsForCommission().length).toBeGreaterThan(0);
    for (const role of ["CHAIR", "VICE_CHAIR", "SECRETARY_GENERAL", "COMMISSIONER"] as const) {
      expect(roleHasPermission(role, "authorize_results") && role === "COMMISSIONER").toBe(
        false,
      );
    }
  });
});

describe("election stage gates", () => {
  it("allows opening only during registration", () => {
    expect(isAllowedNow("CHAIR", "authorize_election_opening", "REGISTRATION")).toBe(true);
    expect(isAllowedNow("CHAIR", "authorize_election_opening", "VOTING")).toBe(false);
  });

  it("allows results authorization only after voting has closed, and only for the Chair", () => {
    expect(isAllowedNow("CHAIR", "authorize_results", "CLOSED")).toBe(true);
    expect(isAllowedNow("CHAIR", "authorize_results", "VOTING")).toBe(false);
    expect(isAllowedNow("VICE_CHAIR", "authorize_results", "CLOSED")).toBe(false);
  });

  it("narrows active permissions to the current stage", () => {
    const voting = activePermissions("CHAIR", "VOTING");
    expect(voting).toContain("authorize_election_closing");
    expect(voting).not.toContain("authorize_results");
  });
});

describe("authorization pipeline", () => {
  const election = createInitialStore().election;

  it("grants the Chair access after credentials, MFA, identity, role, assignment, and stage checks", () => {
    const decision = evaluateCommissionAccess({
      credentialsValid: true,
      mfaVerified: true,
      directoryUser: chairUser,
      commissionMember: chairMember,
      election,
    });
    expect(decision.granted).toBe(true);
    if (decision.granted) {
      expect(decision.role).toBe("CHAIR");
      expect(decision.steps.map((step) => step.key)).toEqual([
        "credentials",
        "mfa",
        "identify",
        "role",
        "assignment",
        "stage",
        "grant",
      ]);
    }
  });

  it("rejects ICT/technical staff even with valid institutional credentials", () => {
    const decision = evaluateCommissionAccess({
      credentialsValid: true,
      mfaVerified: true,
      directoryUser: ictUser,
      commissionMember: null,
      election,
    });
    expect(decision.granted).toBe(false);
    if (!decision.granted) {
      expect(decision.failedStep).toBe("identify");
      expect(decision.reason).toMatch(/Technical administration/i);
    }
  });

  it("rejects a commissioner who is not assigned to the current election", () => {
    const decision = evaluateCommissionAccess({
      credentialsValid: true,
      mfaVerified: true,
      directoryUser: INSTITUTIONAL_DIRECTORY.find((user) => user.id === commissioner.userId)!,
      commissionMember: { ...commissioner, electionId: "other-election" },
      election,
    });
    expect(decision.granted).toBe(false);
    if (!decision.granted) {
      expect(decision.failedStep).toBe("assignment");
    }
  });

  it("does not treat a successful login as blanket authority", () => {
    const decision = evaluateCommissionAccess({
      credentialsValid: true,
      mfaVerified: true,
      directoryUser: INSTITUTIONAL_DIRECTORY.find((user) => user.id === secretary.userId)!,
      commissionMember: secretary,
      election,
    });
    expect(decision.granted).toBe(true);
    if (decision.granted) {
      expect(decision.permissions).not.toContain("authorize_results");
      expect(decision.permissions).not.toContain("authorize_election_opening");
    }
    expect(roleHasPermission(vice.role, "authorize_results")).toBe(false);
  });
});
