import { describe, expect, it } from "vitest";
import {
  contestIdForLeadership,
  leadershipPositionLabel,
  toCabinetCandidate,
  upsertCabinetCandidate,
} from "@/lib/candidate-map";
import { candidatesForUnit, resolveUnits } from "@/lib/electoral";
import { createInitialStore } from "@/lib/seed";
import type { DelegateCandidate } from "@/lib/types";

describe("leadership candidate mapping", () => {
  it("maps seeded position titles onto Cabinet contests", () => {
    expect(contestIdForLeadership({ position: "President" })).toBe("president-ticket");
    expect(contestIdForLeadership({ position: "Secretary General" })).toBe("secretary-general");
    expect(leadershipPositionLabel("treasurer")).toBe("Treasurer / Finance Secretary");
  });

  it("places an approved President ticket on the Cabinet ballot with a running mate", () => {
    const cabinet = toCabinetCandidate({
      id: "cand-new",
      fullName: "Mercy Akinyi Otieno",
      ticket: "Horizon Ticket",
      position: "President + Vice President",
      campus: "Ruaraka",
      contestId: "president-ticket",
      runningMateName: "Peter Njoroge",
      status: "approved",
    });
    expect(cabinet).toMatchObject({
      id: "cab-from-cand-new",
      contestId: "president-ticket",
      fullName: "Mercy Akinyi Otieno",
      runningMateName: "Peter Njoroge",
      ticketLabel: "Horizon Ticket",
      status: "approved",
    });
    const list = upsertCabinetCandidate([], cabinet!);
    expect(upsertCabinetCandidate(list, { ...cabinet!, ticketLabel: "Horizon" })[0].ticketLabel).toBe(
      "Horizon",
    );
  });

  it("does not place a rejected nomination on the Cabinet ballot", () => {
    expect(
      toCabinetCandidate({
        id: "cand-x",
        fullName: "Rejected Name",
        ticket: "Independent",
        position: "Academic Secretary",
        campus: "Town",
        status: "rejected",
      }),
    ).toBeNull();
  });
});

describe("delegate candidate mapping", () => {
  it("shows a newly added delegate on the matching Election 1 unit ballot", () => {
    const store = createInitialStore();
    const now = "2026-11-06T12:00:00.000Z";
    const added: DelegateCandidate = {
      id: "del-test",
      studentId: "24/09991",
      electionId: store.election.id,
      fullName: "Test Delegate Added",
      photo: "data:image/svg+xml,test",
      campusId: "campus-ruaraka",
      schoolId: "school-ru-bus",
      departmentId: "dept-ru-bus-bam",
      candidateType: "DELEGATE",
      approvalStatus: "approved",
      votesReceived: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    store.delegateCandidates.push(added);
    const unit = resolveUnits(store).find((item) => item.departmentId === "dept-ru-bus-bam");
    expect(unit).toBeTruthy();
    const names = candidatesForUnit(store, unit!).map((item) => item.fullName);
    expect(names).toContain("Test Delegate Added");
  });
});
