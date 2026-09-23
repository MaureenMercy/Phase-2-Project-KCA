import { describe, expect, it } from "vitest";
import {
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

  it("keeps Ruaraka departmental and leaves other campuses at school level", () => {
    const ruarakaUnits = store.electoralUnits.filter((item) => item.campusId === "campus-ruaraka");
    expect(ruarakaUnits.every((item) => item.departmentId)).toBe(true);
    const westernUnits = store.electoralUnits.filter((item) => item.campusId === "campus-western");
    expect(westernUnits.every((item) => item.departmentId === null)).toBe(true);
    expect(westernUnits).toHaveLength(3);
  });

  it("does not hard-code or default delegate seats", () => {
    expect(defaultDelegateSeats()).toBeNull();
    expect(store.electoralUnits.every((item) => item.delegateSeats === null)).toBe(true);
    expect(store.electoralUnits.every((item) => item.seatStatus === "UNCONFIGURED")).toBe(true);
  });

  it("maps a student to their unit and refuses a foreign candidate pool", () => {
    const student = store.studentElectors.find((item) => item.studentId === "24/01311")!;
    const ballot = generateElection1Ballot(store, student);
    expect("error" in ballot).toBe(false);
    if ("error" in ballot) return;
    expect(ballot.unit.departmentName).toMatch(/Networking and Applied Computing/);
    expect(ballot.seatsConfigured).toBe(false);
    expect(ballot.candidates.every((candidate) => candidate.departmentId === "dept-ru-tech-nac")).toBe(true);
    expect(ballot.candidates.some((candidate) => candidate.studentId === "24/01201")).toBe(false);
  });

  it("blocks readiness while seats are unconfigured", () => {
    const issues = validateElection1Readiness(store);
    expect(issues.some((issue) => issue.code === "seats")).toBe(true);
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
        schoolId: "school-tn-bus",
        departmentId: null,
      }),
    ).toMatch(/school$/);
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
