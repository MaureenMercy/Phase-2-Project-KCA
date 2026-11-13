import { describe, expect, it } from "vitest";
import {
  agentCan,
  agentMayAccessStation,
  agentStudentId,
  candidateAgentUsage,
  denyForbiddenAgentAction,
  evaluateInvitation,
  findInvitation,
  lockedReason,
  ownReports,
} from "@/lib/agent-access";
import { createInitialStore } from "@/lib/seed";

describe("agent invitation and accreditation gates", () => {
  const store = createInitialStore();

  it("accepts a valid open invitation for the nominated student", () => {
    const invitation = findInvitation(store, "INV-OPEN-7K2M");
    const result = evaluateInvitation({ invitation, studentId: "24/05106", store });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid, expired, revoked, used and unavailable invitations", () => {
    expect(evaluateInvitation({ invitation: null, studentId: "24/05106" }).ok).toBe(false);
    const expired = evaluateInvitation({ invitation: findInvitation(store, "INV-EXP-9Q1C"), studentId: "24/05107" });
    const revoked = evaluateInvitation({ invitation: findInvitation(store, "INV-REV-4H8P"), studentId: "24/05108" });
    const used = evaluateInvitation({ invitation: findInvitation(store, "INV-USED-2N6R"), studentId: "24/05101" });
    const unavailable = evaluateInvitation({ invitation: findInvitation(store, "INV-UNAV-5D3W"), studentId: "24/03401" });
    expect(!expired.ok && expired.code).toBe("expired");
    expect(!revoked.ok && revoked.code).toBe("revoked");
    expect(!used.ok && used.code).toBe("used");
    expect(!unavailable.ok && unavailable.code).toBe("unavailable");
  });

  it("rejects using someone else's invitation", () => {
    const result = evaluateInvitation({
      invitation: findInvitation(store, "INV-OPEN-7K2M"),
      studentId: "24/05101",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("mismatch");
  });

  it("keeps Jane Auma at the configured agent limit", () => {
    expect(store.agentPolicy.maxAgentsPerCandidate).toBe(2);
    expect(candidateAgentUsage(store, "app-cab-si-1")).toBe(2);
  });

  it("locks observation for pending, suspended and revoked agents", () => {
    const pending = store.agents.find((item) => item.id === "agent-002")!;
    const approved = store.agents.find((item) => item.id === "agent-001")!;
    const suspended = store.agents.find((item) => item.id === "agent-004")!;
    const revoked = store.agents.find((item) => item.id === "agent-005")!;
    expect(agentCan(pending, "viewDashboard")).toBe(true);
    expect(agentCan(pending, "observe")).toBe(false);
    expect(agentCan(approved, "observe")).toBe(true);
    expect(agentCan(suspended, "checkIn")).toBe(false);
    expect(agentCan(revoked, "reportIncident")).toBe(false);
    expect(lockedReason(pending, "observe")).toMatch(/approves/i);
  });

  it("enforces assigned-station check-in", () => {
    const approved = store.agents.find((item) => item.id === "agent-001")!;
    expect(agentMayAccessStation(approved, "ps-town")).toBe(true);
    expect(agentMayAccessStation(approved, "ps-ruaraka")).toBe(false);
  });

  it("hides other agents' reports and forbids Commission mutations", () => {
    const mine = ownReports(
      store.incidents.filter((item): item is typeof item & { agentId: string } => Boolean(item.agentId)),
      "agent-001",
    );
    expect(mine.every((item) => item.agentId === "agent-001")).toBe(true);
    expect(mine.some((item) => item.agentId === "agent-003")).toBe(false);
    expect(denyForbiddenAgentAction("declare_results").ok).toBe(false);
    expect(denyForbiddenAgentAction("classify_incidents").error).toMatch(/Commission/);
    expect(denyForbiddenAgentAction("view_other_agent_reports").error).toMatch(/you submitted/i);
  });

  it("does not create a second student identity for an agent", () => {
    const caroline = store.agents.find((item) => item.id === "agent-001")!;
    const identity = store.studentElectors.find((item) => item.studentId === caroline.studentId);
    expect(identity?.fullName).toBe(caroline.fullName);
    expect(store.studentElectors.filter((item) => item.studentId === caroline.studentId)).toHaveLength(1);
  });

  it("finds the approved agent by student ID or agent code", () => {
    const byStudentId = store.agents.find((item) => agentStudentId(item) === "24/05101");
    const byCode = store.agents.find((item) => item.agentCode === "AG-001");
    expect(byStudentId?.id).toBe("agent-001");
    expect(byCode?.studentId).toBe("24/05101");
    expect(byStudentId?.accreditationStatus).toBe("ACCREDITED");
  });
});
