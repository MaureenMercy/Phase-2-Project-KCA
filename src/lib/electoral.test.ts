import { describe, expect, it } from "vitest";
import {
  computeElectedDelegates,
  defaultDelegateSeats,
  generateElection1Ballot,
  isCabinetBallotComplete,
  unitKey,
  validateElection1Readiness,
} from "@/lib/electoral";
import { createInitialStore } from "@/lib/seed";
import { CABINET_CONTEST_IDS } from "@/lib/types";

describe("official electoral structure", () => {
  const store = createInitialStore();

  it("seeds four campuses and does not share a global school record", () => {
    expect(store.campuses.map((item) => item.name)).toEqual([
      "Ruaraka",
      "Western",
      "Town",
      "Kitengela",
    ]);
    const businessSchools = store.schools.filter((item) => item.name === "School of Business");
    expect(businessSchools).toHaveLength(4);
    expect(new Set(businessSchools.map((item) => item.campusId)).size).toBe(4);
  });

  it("keeps Ruaraka departmental, Western at the three signed academic units, and Town/Kitengela campus-wide", () => {
    const ruarakaUnits = store.electoralUnits.filter((item) => item.campusId === "campus-ruaraka");
    expect(ruarakaUnits.every((item) => item.departmentId)).toBe(true);
    expect(ruarakaUnits).toHaveLength(9);
    const westernUnits = store.electoralUnits.filter((item) => item.campusId === "campus-western");
    expect(westernUnits.every((item) => item.departmentId === null && item.unitKind === "SCHOOL")).toBe(true);
    expect(westernUnits).toHaveLength(3);
    expect(store.electoralUnits.filter((item) => item.campusId === "campus-town")).toHaveLength(1);
    expect(store.electoralUnits.filter((item) => item.campusId === "campus-kitengela")).toHaveLength(1);
    expect(store.electoralUnits).toHaveLength(14);
  });

  it("stores the constitutional three seats per college rather than inventing a department default", () => {
    expect(defaultDelegateSeats()).toBeNull();
    expect(store.electoralUnits.every((item) => item.delegateSeats === 3)).toBe(true);
    expect(store.electoralUnits.every((item) => item.allocationSource?.includes("Constitution"))).toBe(true);
  });

  it("maps a student to their unit and refuses a foreign candidate pool", () => {
    const student = store.studentElectors.find((item) => item.studentId === "24/01311")!;
    const ballot = generateElection1Ballot(store, student);
    expect("error" in ballot).toBe(false);
    if ("error" in ballot) return;
    expect(ballot.unit.departmentName).toMatch(/Networking and Applied Computing/);
    expect(ballot.seatsConfigured).toBe(true);
    expect(ballot.votesAllowed).toBe(1);
    expect(ballot.candidates.every((candidate) => candidate.departmentId === "dept-ru-tech-nac")).toBe(true);
    expect(ballot.candidates.some((candidate) => candidate.studentId === "24/01201")).toBe(false);
  });

  it("is ready on the seeded constitutional allocation", () => {
    const issues = validateElection1Readiness(store);
    expect(issues.some((issue) => issue.code === "seats")).toBe(false);
  });

  it("identifies electoral units by election + campus + school + optional department", () => {
    expect(
      unitKey({
        electionId: "saku-2026",
        campusId: "campus-ruaraka",
        schoolId: "school-ru-tech",
        departmentId: "dept-ru-tech-nac",
      }),
    ).toContain("dept-ru-tech-nac");
    expect(
      unitKey({
        electionId: "saku-2026",
        campusId: "campus-town",
        schoolId: null,
        departmentId: null,
        unitKind: "CAMPUS_WIDE",
      }),
    ).toMatch(/campus$/);
  });
});

describe("campus-wide ballots and gender tally", () => {
  const store = createInitialStore();

  it("gives Town students a campus-wide ballot, not a school list", () => {
    const student = store.studentElectors.find((item) => item.studentId === "24/03101")!;
    const ballot = generateElection1Ballot(store, student);
    expect("error" in ballot).toBe(false);
    if ("error" in ballot) return;
    expect(ballot.unit.unitKind).toBe("CAMPUS_WIDE");
    expect(ballot.candidates.every((candidate) => candidate.campusId === "campus-town")).toBe(true);
    expect(ballot.candidates.some((candidate) => candidate.studentId === "24/03201")).toBe(true);
  });

  it("applies the two-thirds gender rule at tally, not on the ballot", () => {
    const fixture = createInitialStore();
    const unit = fixture.electoralUnits.find((item) => item.departmentId === "dept-ru-tech-nac")!;
    fixture.delegateCandidates = fixture.delegateCandidates.map((candidate) => {
      if (candidate.departmentId !== "dept-ru-tech-nac") return candidate;
      const votes =
        candidate.studentId === "24/01311"
          ? 12
          : candidate.studentId === "24/01313"
            ? 11
            : candidate.studentId === "24/01312"
              ? 4
              : 0;
      return { ...candidate, votesReceived: votes };
    });
    fixture.delegateCandidates.push({
      id: "del-extra-m",
      studentId: "24/01303",
      electionId: unit.electionId,
      fullName: "Felix Omondi Otieno",
      photo: "",
      campusId: "campus-ruaraka",
      schoolId: "school-ru-tech",
      departmentId: "dept-ru-tech-nac",
      candidateType: "DELEGATE",
      approvalStatus: "approved",
      votesReceived: 10,
      status: "active",
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    });
    const elected = computeElectedDelegates(fixture).filter((item) => item.unitId === unit.id);
    expect(elected).toHaveLength(3);
    expect(elected.some((item) => item.studentId === "24/01312")).toBe(true);
    expect(elected.some((item) => item.genderRuleApplied)).toBe(true);
  });

  it("keeps Treasurer contestants female in the seeded Council ballot", () => {
    expect(store.cabinetCandidates.filter((item) => item.contestId === "treasurer").every((item) => item.gender === "F")).toBe(true);
  });
});

describe("cabinet ballot rules", () => {
  it("requires all six contests before a ballot is complete", () => {
    expect(isCabinetBallotComplete({})).toBe(false);
    const selections = Object.fromEntries(CABINET_CONTEST_IDS.map((id) => [id, "x"])) as Record<
      (typeof CABINET_CONTEST_IDS)[number],
      string
    >;
    expect(isCabinetBallotComplete(selections)).toBe(true);
    expect(CABINET_CONTEST_IDS).toEqual([
      "special-interests",
      "sports",
      "academic",
      "treasurer",
      "secretary-general",
      "president-ticket",
    ]);
  });
});
