import type {
  AppStore,
  CabinetContestId,
  DelegateCandidate,
  ElectedDelegate,
  ElectoralCollegeEntry,
  ElectoralStructure,
  ElectoralUnitConfiguration,
  School,
  StudentElector,
} from "@/lib/types";
import { CABINET_CONTEST_IDS } from "@/lib/types";
import { ELECTION_1_ID, ELECTION_2_ID } from "@/lib/seed-electorate";

export type ResolvedUnit = {
  id: string;
  key: string;
  campusId: string;
  campusName: string;
  schoolId: string | null;
  schoolName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  unitKind: ElectoralStructure;
  delegateSeats: number | null;
  seatStatus: ElectoralUnitConfiguration["seatStatus"];
  allocationSource: string | null;
  allocationReviewNote: string | null;
  status: ElectoralUnitConfiguration["status"];
};

export function unitKey(input: {
  electionId: string;
  campusId: string;
  schoolId?: string | null;
  departmentId?: string | null;
  unitKind?: ElectoralStructure;
}) {
  if (input.unitKind === "CAMPUS_WIDE" || (!input.schoolId && !input.departmentId)) {
    return [input.electionId, input.campusId, "campus"].join("::");
  }
  return [
    input.electionId,
    input.campusId,
    input.schoolId ?? "school",
    input.departmentId ?? "school",
  ].join("::");
}

export function resolveUnits(store: AppStore): ResolvedUnit[] {
  return store.electoralUnits
    .filter((unit) => unit.status === "active")
    .map((unit) => {
      const campus = store.campuses.find((item) => item.id === unit.campusId);
      const school = unit.schoolId
        ? store.schools.find((item) => item.id === unit.schoolId)
        : null;
      const department = unit.departmentId
        ? store.departments.find((item) => item.id === unit.departmentId)
        : null;
      return {
        id: unit.id,
        key: unitKey(unit),
        campusId: unit.campusId,
        campusName: campus?.name ?? "Unknown campus",
        schoolId: unit.schoolId,
        schoolName: school?.name ?? null,
        departmentId: unit.departmentId,
        departmentName: department?.name ?? null,
        unitKind: unit.unitKind ?? campus?.electoralStructure ?? "SCHOOL",
        delegateSeats: unit.delegateSeats,
        seatStatus: unit.seatStatus,
        allocationSource: unit.allocationSource ?? null,
        allocationReviewNote: unit.allocationReviewNote ?? null,
        status: unit.status,
      };
    });
}

export function unitLabel(
  unit: Pick<ResolvedUnit, "campusName" | "schoolName" | "departmentName" | "unitKind">,
) {
  if (unit.unitKind === "CAMPUS_WIDE" || (!unit.schoolName && !unit.departmentName)) {
    return `${unit.campusName} · Campus-wide Electoral College`;
  }
  return unit.departmentName
    ? `${unit.campusName} · ${unit.schoolName} · ${unit.departmentName}`
    : `${unit.campusName} · ${unit.schoolName}`;
}

export function mappingForStudent(store: AppStore, studentId: string) {
  return (
    store.studentMappings.find(
      (mapping) =>
        mapping.studentId === studentId &&
        (mapping.electionId === ELECTION_1_ID || mapping.electionId === store.election.id),
    ) ?? null
  );
}

export function unitForStudent(store: AppStore, student: StudentElector) {
  const mapping = mappingForStudent(store, student.studentId);
  const units = resolveUnits(store);
  if (mapping?.electoralUnitId) {
    return units.find((unit) => unit.id === mapping.electoralUnitId) ?? null;
  }
  const campus = store.campuses.find((item) => item.id === student.campusId);
  if (campus?.electoralStructure === "CAMPUS_WIDE") {
    return units.find((unit) => unit.campusId === student.campusId && unit.unitKind === "CAMPUS_WIDE") ?? null;
  }
  if (campus?.electoralStructure === "SCHOOL") {
    return units.find(
      (unit) => unit.campusId === student.campusId && unit.schoolId === student.schoolId,
    ) ?? null;
  }
  return (
    units.find(
      (unit) =>
        unit.campusId === student.campusId &&
        unit.schoolId === student.schoolId &&
        (unit.departmentId ?? null) === (student.departmentId ?? null),
    ) ?? null
  );
}

export function candidatesForUnit(store: AppStore, unit: ResolvedUnit) {
  return store.delegateCandidates.filter((candidate) => {
    if (candidate.status !== "active" || candidate.approvalStatus !== "approved") return false;
    const application = store.candidateApplications.find(
      (item) => item.studentId === candidate.studentId && item.electionKind === "DELEGATE",
    );
    if (application && application.participationStatus !== "SELECTED") return false;
    if (unit.unitKind === "CAMPUS_WIDE") return candidate.campusId === unit.campusId;
    if (unit.unitKind === "SCHOOL") {
      return candidate.campusId === unit.campusId && candidate.schoolId === unit.schoolId;
    }
    return (
      candidate.campusId === unit.campusId &&
      candidate.schoolId === unit.schoolId &&
      (candidate.departmentId ?? null) === (unit.departmentId ?? null)
    );
  });
}

export type Election1Ballot = {
  unit: ResolvedUnit;
  seats: number | null;
  seatsConfigured: boolean;
  candidates: DelegateCandidate[];
  votesAllowed: 1;
  warning?: string;
};

export function generateElection1Ballot(
  store: AppStore,
  student: StudentElector,
): Election1Ballot | { error: string } {
  const unit = unitForStudent(store, student);
  if (!unit) {
    return { error: "No electoral unit is mapped for this student." };
  }
  const candidates = candidatesForUnit(store, unit);
  const seatsConfigured = typeof unit.delegateSeats === "number" && unit.delegateSeats > 0;
  return {
    unit,
    seats: unit.delegateSeats,
    seatsConfigured,
    candidates,
    votesAllowed: 1,
    warning: seatsConfigured
      ? undefined
      : "Delegate seat allocation has not been configured for this electoral unit.",
  };
}

export type ValidationIssue = {
  code: string;
  message: string;
  unitId?: string;
};

export function validateElection1Readiness(store: AppStore): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const units = resolveUnits(store);

  for (const unit of units) {
    if (!unit.campusId) {
      issues.push({ code: "campus", message: "Electoral unit is missing a campus.", unitId: unit.id });
    }
    if (!unit.schoolId && unit.unitKind !== "CAMPUS_WIDE") {
      issues.push({ code: "school", message: "Electoral unit is missing a school.", unitId: unit.id });
    }
    if (typeof unit.delegateSeats !== "number" || unit.delegateSeats < 1) {
      issues.push({
        code: "seats",
        message: `${unitLabel(unit)} has no configured delegate-seat allocation.`,
        unitId: unit.id,
      });
    }
  }

  for (const candidate of store.delegateCandidates.filter((item) => item.status === "active")) {
    const unit = units.find((item) => {
      if (item.campusId !== candidate.campusId) return false;
      if (item.unitKind === "CAMPUS_WIDE") return true;
      if (item.unitKind === "SCHOOL") return item.schoolId === candidate.schoolId;
      return (
        item.schoolId === candidate.schoolId &&
        (item.departmentId ?? null) === (candidate.departmentId ?? null)
      );
    });
    if (!unit) {
      issues.push({
        code: "candidate_unit",
        message: `${candidate.fullName} is mapped to an invalid electoral unit.`,
      });
    }
  }

  for (const student of store.studentElectors.filter((item) => item.eligibilityStatus === "eligible")) {
    if (!unitForStudent(store, student)) {
      issues.push({
        code: "elector_unit",
        message: `${student.fullName} (${student.studentId}) is not mapped to a valid electoral unit.`,
      });
    }
  }

  return issues;
}

function genderOf(store: AppStore, studentId: string): StudentElector["gender"] {
  return store.studentElectors.find((item) => item.studentId === studentId)?.gender ?? "UNSPECIFIED";
}

function applyTwoThirdsGenderRule(
  ranked: DelegateCandidate[],
  seats: number,
  store: AppStore,
): { selected: DelegateCandidate[]; applied: boolean; note: string | null } {
  if (seats < 3 || ranked.length <= seats) {
    return { selected: ranked.slice(0, seats), applied: false, note: null };
  }
  const take = ranked.slice(0, seats);
  const genders = take.map((candidate) => genderOf(store, candidate.studentId));
  const known = genders.filter((gender) => gender === "F" || gender === "M");
  if (known.length < seats) {
    return {
      selected: take,
      applied: false,
      note: "Gender data is incomplete for this Electoral College. Two-thirds review flagged.",
    };
  }
  const female = known.filter((gender) => gender === "F").length;
  const male = known.filter((gender) => gender === "M").length;
  if (female <= 2 && male <= 2) {
    return { selected: take, applied: false, note: null };
  }
  const overrepresented: "F" | "M" = female > 2 ? "F" : "M";
  const needed: "F" | "M" = overrepresented === "F" ? "M" : "F";
  const replacement = ranked.slice(seats).find((candidate) => genderOf(store, candidate.studentId) === needed);
  if (!replacement) {
    return {
      selected: take,
      applied: false,
      note: "Two-thirds gender rule could not be satisfied from remaining candidates. Flagged for Commission review.",
    };
  }
  const adjusted = [...take.slice(0, seats - 1), replacement];
  return {
    selected: adjusted,
    applied: true,
    note: `Constitutional two-thirds rule applied: replaced the third same-gender candidate with ${replacement.fullName}.`,
  };
}

export function computeElectedDelegates(store: AppStore): ElectedDelegate[] {
  const elected: ElectedDelegate[] = [];
  for (const unit of resolveUnits(store)) {
    if (typeof unit.delegateSeats !== "number" || unit.delegateSeats < 1) continue;
    const ranked = candidatesForUnit(store, unit)
      .slice()
      .sort((a, b) => b.votesReceived - a.votesReceived || a.fullName.localeCompare(b.fullName));
    const { selected, applied, note } = applyTwoThirdsGenderRule(ranked, unit.delegateSeats, store);
    selected.forEach((candidate, index) => {
      elected.push({
        id: `elected-${unit.id}-${index + 1}`,
        electionId: ELECTION_1_ID,
        studentId: candidate.studentId,
        candidateId: candidate.id,
        unitId: unit.id,
        fullName: candidate.fullName,
        votesReceived: candidate.votesReceived,
        gender: genderOf(store, candidate.studentId),
        rank: index + 1,
        genderRuleApplied: applied,
        genderRuleNote: note,
        confirmed: false,
      });
    });
  }
  return elected;
}

export function deriveElectoralCollege(
  store: AppStore,
  elected: ElectedDelegate[],
): ElectoralCollegeEntry[] {
  return elected.map((delegate) => {
      const student = store.studentElectors.find((item) => item.studentId === delegate.studentId);
      return {
        id: `college-${delegate.studentId}`,
        electionId: ELECTION_2_ID,
        studentId: delegate.studentId,
        registrationNumber: delegate.studentId,
        fullName: delegate.fullName,
        campusId: student?.campusId ?? "",
        schoolId: student?.schoolId ?? "",
        departmentId: student?.departmentId ?? null,
        electorStatus: "pending_verification" as const,
      };
    });
}

export const CABINET_CONTESTS: {
  id: CabinetContestId;
  title: string;
  instruction: string;
  kind: "candidate" | "ticket";
}[] = [
  {
    id: "special-interests",
    title: "Special Interests Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "sports",
    title: "Sports & Entertainment Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "academic",
    title: "Academic Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "treasurer",
    title: "Treasurer / Finance Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "secretary-general",
    title: "Secretary General",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "president-ticket",
    title: "President + Vice President",
    instruction: "Select ONE ticket.",
    kind: "ticket",
  },
];

export function cabinetStepIndex(id: CabinetContestId) {
  return CABINET_CONTEST_IDS.indexOf(id);
}

export function isCabinetBallotComplete(selections: Partial<Record<CabinetContestId, string>>) {
  return CABINET_CONTEST_IDS.every((id) => Boolean(selections[id]));
}

export function schoolsByCampus(schools: School[], campusId: string) {
  return schools.filter((school) => school.campusId === campusId);
}

export function defaultDelegateSeats(): null {
  return null;
}

export function constitutionalSeatsPerCollege(): 3 {
  return 3;
}
